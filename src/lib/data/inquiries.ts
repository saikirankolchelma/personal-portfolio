import "server-only";
import { prisma } from "@/lib/db";
import type { InquiryStatus } from "@prisma/client";

/**
 * Inquiries are not user-scoped — there is one owner, and the public form is
 * what writes them. Reads still happen only from authenticated dashboard
 * routes, which check the session before calling in here.
 */

export async function listInquiries(status?: InquiryStatus) {
  return prisma.inquiry.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function inquiryCounts() {
  const rows = await prisma.inquiry.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts: Record<InquiryStatus, number> = {
    NEW: 0,
    READ: 0,
    REPLIED: 0,
    ARCHIVED: 0,
    SPAM: 0,
  };
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  await prisma.inquiry.update({ where: { id }, data: { status } });
}
