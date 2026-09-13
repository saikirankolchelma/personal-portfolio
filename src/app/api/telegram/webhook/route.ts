import { NextResponse } from "next/server";

import { prisma, isDatabaseConfigured } from "@/lib/db";
import { isGeminiConfigured } from "@/lib/gemini";
import { extractTask } from "@/lib/task-extraction";
import {
  allowedTelegramUserId,
  escapeHtml,
  isTelegramConfigured,
  sendTelegramMessage,
} from "@/lib/telegram";
import { taskCategoryLabels, taskStatusLabels } from "@/lib/dashboard-nav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Telegram webhook: a message from the owner's phone becomes a task.
 *
 * Two independent gates, both required:
 *  1. The secret token Telegram echoes in X-Telegram-Bot-Api-Secret-Token,
 *     which proves the request came from Telegram and not from anyone who
 *     guessed the URL.
 *  2. The sender's numeric Telegram id must equal TELEGRAM_ALLOWED_USER_ID.
 *     Anyone else who finds the bot gets a refusal and writes nothing.
 *
 * Responses are always 200. Telegram retries non-2xx replies, and retrying a
 * message we deliberately rejected would accomplish nothing.
 */

type TelegramUpdate = {
  message?: {
    message_id: number;
    from?: { id: number; first_name?: string; is_bot?: boolean };
    chat: { id: number };
    text?: string;
    date: number;
  };
};

const ok = () => NextResponse.json({ ok: true });

function formatTaskLine(task: {
  title: string;
  status: keyof typeof taskStatusLabels;
  date: Date;
}) {
  const mark = task.status === "COMPLETED" ? "✓" : task.status === "BLOCKED" ? "✗" : "•";
  return `${mark} ${escapeHtml(task.title)}`;
}

function startOfDay(offsetDays = 0) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

export async function POST(request: Request) {
  // ---------------------------------------------------------------- gate 1
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("[telegram] TELEGRAM_WEBHOOK_SECRET is not set; refusing.");
    return ok();
  }

  const providedSecret = request.headers.get("x-telegram-bot-api-secret-token");
  if (providedSecret !== expectedSecret) {
    console.warn("[telegram] rejected update with bad or missing secret token");
    // 401 rather than 200: this did not come from Telegram at all.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured() || !isTelegramConfigured()) {
    console.error("[telegram] database or bot configuration missing.");
    return ok();
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return ok();
  }

  const message = update.message;
  const text = message?.text?.trim();
  if (!message || !text || message.from?.is_bot) return ok();

  const chatId = message.chat.id;
  const senderId = String(message.from?.id ?? "");

  // ---------------------------------------------------------------- gate 2
  if (senderId !== allowedTelegramUserId()) {
    console.warn(`[telegram] rejected message from unauthorized sender ${senderId}`);
    await sendTelegramMessage(
      chatId,
      "This is a private assistant and you are not its owner. Nothing was recorded.",
    );
    return ok();
  }

  const user = await prisma.user.findFirst({
    where: { telegramId: senderId },
    select: { id: true },
  });

  if (!user) {
    await sendTelegramMessage(
      chatId,
      "Your Telegram account is not linked yet. Set TELEGRAM_ALLOWED_USER_ID and re-run <code>npm run db:seed</code>.",
    );
    return ok();
  }

  // Every inbound message is stored verbatim, so an extraction can be audited
  // or re-run later without the original text being lost.
  const inbound = await prisma.inboundMessage.create({
    data: { userId: user.id, externalId: senderId, text, channel: "telegram" },
  });

  const command = text.toLowerCase();

  /* -------------------------------------------------------- commands */

  if (command === "/start" || command === "/help") {
    await sendTelegramMessage(
      chatId,
      [
        "<b>Work journal bot</b>",
        "",
        "Just send me what you worked on and I will file it:",
        "<i>“Finished the guardrail node, need to test the workflow tomorrow”</i>",
        "",
        "<b>Commands</b>",
        "/today — today's tasks",
        "/pending — everything still open",
        "/week — the last 7 days",
        "/done &lt;text&gt; — mark a matching task completed",
      ].join("\n"),
    );
    await prisma.inboundMessage.update({
      where: { id: inbound.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
    return ok();
  }

  if (command === "/today" || command === "/pending" || command === "/week") {
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        ...(command === "/today"
          ? { date: { gte: startOfDay(), lte: startOfDay() } }
          : command === "/week"
            ? { date: { gte: startOfDay(-6) } }
            : { status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] } }),
      },
      select: { title: true, status: true, date: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 30,
    });

    const heading =
      command === "/today"
        ? "Today"
        : command === "/week"
          ? "Last 7 days"
          : "Still open";

    await sendTelegramMessage(
      chatId,
      tasks.length
        ? `<b>${heading}</b>\n\n${tasks.map(formatTaskLine).join("\n")}`
        : `<b>${heading}</b>\n\nNothing here yet.`,
    );

    await prisma.inboundMessage.update({
      where: { id: inbound.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
    return ok();
  }

  if (command.startsWith("/done")) {
    const query = text.slice(5).trim();
    if (!query) {
      await sendTelegramMessage(chatId, "Tell me which task, e.g. <code>/done guardrail</code>");
      return ok();
    }

    const match = await prisma.task.findFirst({
      where: {
        userId: user.id,
        status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] },
        title: { contains: query, mode: "insensitive" },
      },
      orderBy: { date: "desc" },
      select: { id: true, title: true },
    });

    if (!match) {
      await sendTelegramMessage(
        chatId,
        `No open task matching “${escapeHtml(query)}”.`,
      );
    } else {
      await prisma.task.update({
        where: { id: match.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      await sendTelegramMessage(chatId, `✓ Completed: <b>${escapeHtml(match.title)}</b>`);
    }

    await prisma.inboundMessage.update({
      where: { id: inbound.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
    return ok();
  }

  /* --------------------------------------------- free text -> new task */

  if (!isGeminiConfigured()) {
    await sendTelegramMessage(
      chatId,
      "I saved your message, but GEMINI_API_KEY is not set so I could not turn it into a task yet.",
    );
    return ok();
  }

  try {
    const extracted = await extractTask(text);

    if (extracted.needsClarification) {
      await prisma.inboundMessage.update({
        where: { id: inbound.id },
        data: {
          status: "NEEDS_CLARIFICATION",
          extracted: JSON.parse(JSON.stringify(extracted)),
        },
      });
      await sendTelegramMessage(
        chatId,
        extracted.clarificationQuestion ??
          "Could you say a bit more about what you worked on?",
      );
      return ok();
    }

    // Match the project by the name the model picked up, if there is one.
    const project = extracted.projectHint
      ? await prisma.workProject.findFirst({
          where: {
            userId: user.id,
            name: { contains: extracted.projectHint, mode: "insensitive" },
          },
          select: { id: true, name: true },
        })
      : null;

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        projectId: project?.id ?? null,
        title: extracted.title,
        description: extracted.description || null,
        date: new Date(`${extracted.date}T00:00:00.000Z`),
        status: extracted.status,
        category: extracted.category,
        priority: extracted.priority,
        timeSpent: extracted.timeSpent,
        tags: extracted.tags,
        nextSteps: extracted.nextSteps,
        completedAt: extracted.status === "COMPLETED" ? new Date() : null,
        source: "telegram",
      },
    });

    await prisma.inboundMessage.update({
      where: { id: inbound.id },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
        createdTaskId: task.id,
        extracted: JSON.parse(JSON.stringify(extracted)),
      },
    });

    const lines = [
      `✓ <b>${escapeHtml(task.title)}</b>`,
      `${taskStatusLabels[task.status]} · ${taskCategoryLabels[task.category]} · ${extracted.date}`,
    ];
    if (project) lines.push(`Project: ${escapeHtml(project.name)}`);
    if (task.timeSpent) lines.push(`Time: ${task.timeSpent} min`);
    if (task.tags.length) lines.push(`Tags: ${escapeHtml(task.tags.join(", "))}`);
    if (task.nextSteps.length) {
      lines.push(
        "",
        "<b>Next</b>",
        ...task.nextSteps.map((s) => `• ${escapeHtml(s)}`),
      );
    }

    await sendTelegramMessage(chatId, lines.join("\n"), {
      replyToMessageId: message.message_id,
    });
  } catch (error) {
    console.error("[telegram] extraction failed", error);
    await prisma.inboundMessage.update({
      where: { id: inbound.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message.slice(0, 500) : "unknown",
      },
    });
    await sendTelegramMessage(
      chatId,
      "I saved your message but could not turn it into a task. It is stored, so nothing is lost — try again or add it from the dashboard.",
    );
  }

  return ok();
}
