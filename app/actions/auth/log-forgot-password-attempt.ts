"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

type LogForgotPasswordAttemptInput = {
  email?: string;
  source?: string;
};

export async function logForgotPasswordAttempt(input: LogForgotPasswordAttemptInput = {}) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip") ?? "unknown";
  const userAgent = headerStore.get("user-agent") ?? "unknown";
  const email = input.email?.trim().toLowerCase() || null;

  await prisma.passwordResetAttempt.create({
    data: {
      email,
      ipAddress: ipAddress === "unknown" ? null : ipAddress,
      userAgent: userAgent === "unknown" ? null : userAgent,
      source: input.source || "login_forgot_password_button",
    },
  });
}