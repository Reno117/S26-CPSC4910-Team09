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

    // If approved, update driver profile
    if (decision === "approved") {
      await tx.driverProfile.update({
        where: { id: application.driverProfileId },
        data: {
          sponsorId: application.sponsorId,
          status: "active",
        },
      });
    }
  });

  revalidatePath("/sponsor/driverApplications");
  revalidatePath("/sponsor/viewDrivers");
  revalidatePath("/sponsor");
  
  return { success: true };
}