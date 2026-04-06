"use server";

import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/auth-helpers";

export async function getUnreadAlerts() {
  const user = await requireDriver();

  return prisma.alert.findMany({
    where: { userId: user.id, isRead: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function markAllAlertsRead() {
  const user = await requireDriver();

  await prisma.alert.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
}