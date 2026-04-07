"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getCurrentUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session.user.id;
}

export async function getMyAlerts() {
  const userId = await getCurrentUserId();

  return prisma.alert.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getUnreadAlertCount() {
  const userId = await getCurrentUserId();

  return prisma.alert.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function markAlertRead(alertId: string) {
  const userId = await getCurrentUserId();

  await prisma.alert.updateMany({
    where: {
      id: alertId,
      userId,
    },
    data: {
      isRead: true,
    },
  });

  revalidatePath("/alerts");
}

export async function markAllAlertsRead() {
  const userId = await getCurrentUserId();

  await prisma.alert.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  revalidatePath("/alerts");
}
export async function getUnreadAlerts() {
  const userId = await getCurrentUserId();

  return prisma.alert.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}