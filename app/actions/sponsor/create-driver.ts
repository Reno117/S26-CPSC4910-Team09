"use server";

import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function createDriverManually(data: {
  name: string;
  email: string;
  password: string;
  sponsorId: string; // Now required - sponsor or admin must choose
}) {
  const { isAdmin, sponsorId: userSponsorId } = await requireSponsorOrAdmin();

  // Determine which sponsor to use
  let targetSponsorId: string;
  
  if (isAdmin) {
    // Admin can create drivers for any sponsor
    targetSponsorId = data.sponsorId;
  } else {
    // Sponsor can only create drivers for their own organization
    targetSponsorId = userSponsorId!;
    
    // Security check: make sure sponsor isn't trying to assign to another sponsor
    if (data.sponsorId !== userSponsorId) {
      throw new Error("Unauthorized: Cannot create drivers for other sponsors");
    }
  }

  // Verify sponsor exists
  const sponsor = await prisma.sponsor.findUnique({
    where: { id: targetSponsorId },
  });

  if (!sponsor) {
    throw new Error("Sponsor not found");
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("Email already in use");
  }

  // Create user account
  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      role: "driver",
      // Note: You'll need to handle password hashing with Better Auth
      // For now, this creates a user without auth credentials
    },
  });

  // Create driver profile linked to sponsor
  await prisma.driverProfile.create({
    data: {
      userId: user.id,
      sponsorId: targetSponsorId,
      status: "active", // manually created = auto-approved
      pointsBalance: 0,
    },
  });

  revalidatePath("/sponsor/drivers");
  revalidatePath("/sponsor");
  
  return { success: true, driverId: user.id };
}