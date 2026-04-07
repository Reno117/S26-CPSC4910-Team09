"use server";

import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";


export async function addPoints(
  driverProfileId: string,
  amount: number,
  reason: string,
  sponsorIdParam?: string
) {
  const { user, isAdmin, sponsorId } = await requireSponsorOrAdmin();

  // Verify driver belongs to this sponsor (unless admin)
  const driverProfile = await prisma.driverProfile.findUnique({
    where: { id: driverProfileId },
  });
console.log("sponsorIdParam:", sponsorIdParam);
console.log("sponsorId from auth:", sponsorId);
  if (!driverProfile) {
    throw new Error("Driver not found");
  }
  // Use the driver's actual sponsorId for the point change record
  const actualSponsorId = sponsorIdParam ?? sponsorId;
  
  if (!actualSponsorId) {
    throw new Error("Driver is not associated with a sponsor");
  };

   // Verify the driver is actually sponsored by this sponsor via bridge table
  if (!isAdmin) {
    const sponsorship = await prisma.sponsoredBy.findUnique({
      where: {
        driverId_sponsorOrgId: {
          driverId: driverProfileId,
          sponsorOrgId: actualSponsorId,
        },
      },
    });
    if (!sponsorship) {
      throw new Error("Unauthorized: Driver not in your organization");
    }
  }

  const currentSponsorship = await prisma.sponsoredBy.findUnique({
    where: {
      driverId_sponsorOrgId: {
        driverId: driverProfileId,
        sponsorOrgId: actualSponsorId,
      },
    },
  });

  const pointsBefore = currentSponsorship?.points ?? 0;
  const pointsAfter = pointsBefore + amount;

  const sponsorUser = await prisma.sponsorUser.findUnique({
    where: { userId: user.id },
  });

  const changeType = amount >= 0 ? "ADD" : "DEDUCT";

  const alertContent = amount > 0
  ? `${amount} Points have been added to your account`
  : `${Math.abs(amount)} Points have been deducted from your account`;

  const pchangeAlertOn = await prisma.alertPreferences.findUnique({
    where: {
      userId: driverProfile.userId,
    }
  });
  // Update points in transaction
  await prisma.$transaction([
    prisma.sponsoredBy.update({
      where: { 
        driverId_sponsorOrgId: {
          driverId: driverProfileId,
          sponsorOrgId: actualSponsorId, 
        },
      },
      data: {
        points: {
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

     prisma.pointLog.create({
      data: {
        driverId: driverProfileId,
        sponsorId: actualSponsorId,
        sponsorUserId: sponsorUser?.id ?? null,
        adminUserId: isAdmin ? user.id : null,
        pointsBefore,
        pointsAfter,
        amountChange: amount,
        changeType,
        changeReason: reason,
      },
    }),
  ]);

  if(pchangeAlertOn?.pointChangeAlert)
  {
    await prisma.alert.create({
      data: {
        alertContent: alertContent,
        alertType: "POINT_CHANGE",
        userId: driverProfile.userId,
      },
    })
  };

  revalidatePath(`/sponsor/drivers`);
  
  return { success: true };
}