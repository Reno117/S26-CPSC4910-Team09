"use server";
 
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
 
export async function logPassedSignIn(): Promise<void> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
 
    if (session?.user?.id) {
      await prisma.signInAttempt.create({
        data: {
          success: true,
          userId: session.user.id,
        },
      });
    }
  } catch (err) {
    console.error("Failed to log sign-in attempt:", err);
  }
}