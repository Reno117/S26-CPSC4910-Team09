"use server";

import { auth } from "@/lib/auth"; // adjust to your auth import
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma"; // adjust to your prisma import
import { revalidatePath } from "next/cache";

export async function getAlertPreferences() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) return null;

  const prefs = await prisma.alertPreferences.findUnique({
    where: { userId: session.user.id },
  });

  // Return defaults if none exist yet
  return prefs ?? {
    passwordChangeAlert: true,
    pointChangeAlert: true,
    adminChangeAlert: true,
    orderAlert: true,
    applicationAlert: true,
    statusAlert: true,
  };
}