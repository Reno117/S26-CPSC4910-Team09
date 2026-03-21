"use server";
 
import { prisma } from "@/lib/prisma";
 
export async function logFailedSignIn(email: string): Promise<void> {
  try {
    // Look up the user by email so we can associate the attempt if they exist
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
 
    await prisma.signInAttempt.create({
      data: {
        success: false,
        // Only set userId if the account exists — wrong email won't have one
        ...(user?.id ? { userId: user.id } : {}),
      },
    });
  } catch (err) {
    // Don't let logging failures break the auth flow
    console.error("Failed to log sign-in attempt:", err);
  }
}