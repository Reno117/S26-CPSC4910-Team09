"use server";

import { prisma } from "@/lib/prisma";
import { requireSponsorUser } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function reviewApplication(
  applicationId: string,
  decision: "approved" | "rejected",
  reason?: string
) {
  const sponsorUser = await requireSponsorUser();

  const application = await prisma.driverApplication.findUnique({
    where: { id: applicationId },
    include: { driverProfile: true },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  // Verify sponsor owns this application
  if (application.sponsorId !== sponsorUser.sponsorUser!.sponsorId) {
    throw new Error("Unauthorized");
  }

  const previousDriverStatus = application.driverProfile.status;


  await prisma.$transaction(async (tx) => {
    // Update application
    await tx.driverApplication.update({
      where: { id: applicationId },
      data: {
        status: decision,
        reason: reason,
        reviewedBy: sponsorUser.id,
      },
    });

    // Log application status change
    const newStatus = decision === "approved" ? "ACCEPTED" : "REJECTED";
    await tx.applicationLog.create({
      data: {
        driverId: application.driverProfileId,
        sponsorId: application.sponsorId,
        sponsorUserId: sponsorUser.sponsorUser?.id,
        previousStatus: "PENDING",
        newStatus: newStatus,
      },
    });

    // If approved, update driver profile
    if (decision === "approved") {
      await tx.driverProfile.update({
        where: { id: application.driverProfileId },
        data: {
          status: "active",
        },
      });
    
    await tx.sponsoredBy.upsert({
    where: {
      driverId_sponsorOrgId: {
        driverId: application.driverProfileId,
        sponsorOrgId: application.sponsorId,
      },
    },
    create: {
      driverId: application.driverProfileId,
      sponsorOrgId: application.sponsorId,
      points: 0,
    },
    update: {},
  });
    }
  });

  if (decision === "approved") {
    console.log("sponsorUser:", sponsorUser);
    await prisma.driverStatusLog.create({
      data: {
        driverId: application.driverProfileId,
        sponsorUserId: sponsorUser.sponsorUser?.id,
        adminUserId: null,
        previousStatus: previousDriverStatus,
        newStatus: "active",
        changeReason: "Application approved by sponsor",
      },
    });
  }

  revalidatePath("/sponsor/driverApplications");
  revalidatePath("/sponsor/viewDrivers");
  revalidatePath("/sponsor");
  
  return { success: true };
}