"use server";

import { prisma } from "@/lib/prisma";

type AlertType = "PASSWORD_CHANGE" | "POINT_CHANGE" | "ADMIN_CHANGE" | "ORDER" | "APPLICATION" | "STATUS";

const PREF_KEY_MAP: Record<AlertType, string> = {
  PASSWORD_CHANGE: "passwordChangeAlert",
  POINT_CHANGE:    "pointChangeAlert",
  ADMIN_CHANGE:    "adminChangeAlert",
  ORDER:           "orderAlert",
  APPLICATION:     "applicationAlert",
  STATUS:          "statusAlert",
};

export async function createAlert(
  userId: string,
  alertType: AlertType,
  alertContent: string
) {
  const prefs = await prisma.alertPreferences.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const prefKey = PREF_KEY_MAP[alertType];
  if (!(prefs as Record<string, unknown>)[prefKey]) return;

  await prisma.alert.create({
    data: { userId, alertType, alertContent },
  });
}