"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";
import { logForgotPasswordAttempt } from "@/app/actions/auth/log-forgot-password-attempt";
import { createAlert } from "@/app/actions/alerts/create-alert";

export async function resetPassword(email: string, newPassword: string) {
  if (!email || !newPassword) {
    throw new Error("Email and password are required");
  }

  await logForgotPasswordAttempt({
    email,
    source: "forgot_password_change_password_submit",
  });

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
      include: {
        accounts: true,
      },
    });

    if (!user) {
      throw new Error("User not found with this email address");
    }

    // Hash the new password using better-auth's crypto function
    const hashedPassword = await hashPassword(newPassword);

    // Find the existing credential account
    const existingAccount = user.accounts.find((a) => a.providerId === "credential");

    if (existingAccount) {
      // Update the existing account with new password hash
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: hashedPassword },
      });
    } else {
      // Create new credential account
      await prisma.account.create({
        data: {
          id: `credential_${user.id}`,
          userId: user.id,
          accountId: email.trim(),
          providerId: "credential",
          password: hashedPassword,
        },
      });
    }

    // Clear all existing sessions to force re-login
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    const role = user.role?.toLowerCase();
    if (role === "admin" || role === "sponsor" || role === "driver") {
      await createAlert(
        user.id,
        "PASSWORD_CHANGE",
        "Your password was reset successfully."
      );
    }

    revalidatePath("/login");
    revalidatePath("/forgot-password");

    return {
      success: true,
      message: "Password reset successfully. Please log in with your new password.",
    };
  } catch (error) {
    console.error("Password reset error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to reset password"
    );
  }
}
