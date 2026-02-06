"use server";

import { prisma } from "@/lib/prisma";
import { requireSponsorUser } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function createDriverManually(data: {
  name: string;
  email: string;
  password: string;
}) {
  const sponsorUser = await requireSponsorUser();
  const sponsorId = sponsorUser.sponsorUser!.sponsorId;

  // Create user account
  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      role: "driver",
      // You'll need to hash the password with Better Auth's method
    },
  });

  // Create driver profile linked to sponsor
  await prisma.driverProfile.create({
    data: {
      userId: user.id,
      sponsorId: sponsorId,
      status: "active", // manually created = auto-approved
      pointsBalance: 0,
    },
  });
  //This currently does not work for admin b/c they don't have a sponsorId tied to their account.
  //This current logic doesn't allow the admin or sponsorUser to choose which sponsor
  //they want the driver to be tied to.

  revalidatePath("/sponsor/drivers");
  
  return { success: true, driverId: user.id };
}