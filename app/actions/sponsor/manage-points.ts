"use server";

import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function addPoints(
  driverProfileId: string,
  amount: number,
  reason: string
) {
  const { user, isAdmin, sponsorId } = await requireSponsorOrAdmin();

  // Verify driver belongs to this sponsor (unless admin)
  const driverProfile = await prisma.driverProfile.findUnique({
    where: { id: driverProfileId },
  });

  if (!driverProfile) {
    throw new Error("Driver not found");
  }

  // Sponsors can only manage their own drivers, admins can manage any
  if (!isAdmin && driverProfile.sponsorId !== sponsorId) {
    throw new Error("Unauthorized: Driver not in your organization");
  }

  // Use the driver's actual sponsorId for the point change record
  const actualSponsorId = driverProfile.sponsorId;
  
  if (!actualSponsorId) {
    throw new Error("Driver is not associated with a sponsor");
  }

  // Update points in transaction
  await prisma.$transaction([
    prisma.driverProfile.update({
      where: { id: driverProfileId },
      data: {
        pointsBalance: {
          increment: amount,
        },
      },
    }),
    
    prisma.pointChange.create({
      data: {
        driverProfileId: driverProfileId,
        sponsorId: actualSponsorId,
        amount: amount,
        reason: reason,
        changedBy: user.id,
      },
    }),
  ]);

  revalidatePath(`/sponsor/drivers`);
  
  return { success: true };
}