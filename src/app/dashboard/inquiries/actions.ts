"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/lib/session";
import { setInquiryStatus } from "@/lib/data/inquiries";

const statusEnum = z.enum(["NEW", "READ", "REPLIED", "ARCHIVED", "SPAM"]);

export async function setInquiryStatusAction(formData: FormData) {
  // The session check is the authorization boundary here, not the proxy.
  await requireUserId();

  const id = String(formData.get("id") ?? "");
  const status = statusEnum.safeParse(formData.get("status"));
  if (!id || !status.success) return;

  await setInquiryStatus(id, status.data);
  revalidatePath("/dashboard/inquiries");
}
