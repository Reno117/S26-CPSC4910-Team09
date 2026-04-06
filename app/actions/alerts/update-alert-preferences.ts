"use server";

import { auth } from "@/lib/auth"; // adjust to your auth import
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma"; // adjust to your prisma import
import { revalidatePath } from "next/cache";

export type AlertPreferencesInput = {
  passwordChangeAlert: boolean;
  pointChangeAlert: boolean;
  adminChangeAlert: boolean;
  orderAlert: boolean;
  applicationAlert: boolean;
  statusAlert: boolean;
};

export async function updateAlertPreferences(data: AlertPreferencesInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.alertPreferences.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  revalidatePath("/driver/settings");
  return { success: true };
}