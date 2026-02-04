"use server";

import { prisma } from "@/lib/prisma";
import { requireSponsorUser } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function createSponsorUser(sponsorId: string) {
  const user = await requireSponsorUser();

  // Prevent duplicates
  const existing = await prisma.sponsorUser.findUnique({
    where: {
      userId_sponsorId: {
        userId: user.id,
        sponsorId,
      },
    },
  });

  if (existing) {
    throw new Error("User is already linked to this sponsor");
  }

  await prisma.sponsorUser.create({
    data: {
      userId: user.id,
      sponsorId,
    },
  });

  revalidatePath("/sponsor");
  return { success: true };
}
