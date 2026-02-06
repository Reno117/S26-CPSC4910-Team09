"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function createSponsorUser(sponsorId: string) {
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("Not authenticated");
  }

  const sponsor = await prisma.sponsor.findUnique({
    where: { id: sponsorId },
  });
  //This currently does not work for admin b/c they don't have a sponsorId tied to their account.
  //This current logic doesn't allow the sponsorUser to be choose which sponsor
  //they want the sponsor to be tied to.

  if (!sponsor) {
    throw new Error("Sponsor not found");
  }

  return prisma.sponsorUser.create({
    data: {
      userId: user.id,
      sponsorId: sponsor.id,
    },
  });
}
