"use server";

import { prisma } from "@/lib/prisma";
import { createAlert } from "@/app/actions/alerts/create-alert";
import { revalidatePath } from "next/cache";

export async function applyToSponsor(
  driverProfileId: string,
  sponsorId: string
) {
  // Check if driver already has a pending/approved application to this sponsor
  const existingApplication = await prisma.driverApplication.findFirst({
    where: {
      driverProfileId: driverProfileId,
      sponsorId: sponsorId,
      status: {
        in: ["pending", "approved"],
      },
    },
  });

  if (existingApplication) {
    throw new Error(
      `You already have a ${existingApplication.status} application with this sponsor`
    );
  }

  // Check if there's a dropped application - if so, delete it to allow reapplication
  const droppedApplication = await prisma.driverApplication.findFirst({
    where: {
      driverProfileId: driverProfileId,
      sponsorId: sponsorId,
      status: "dropped",
    },
  });

  if (droppedApplication) {
    await prisma.driverApplication.delete({
      where: { id: droppedApplication.id },
    });
  }

  // Create the application
  await prisma.driverApplication.create({
    data: {
      driverProfileId: driverProfileId,
      sponsorId: sponsorId,
      status: "pending",
    },
  });

  // Log the application submission
  await prisma.applicationLog.create({
    data: {
      driverId: driverProfileId,
      sponsorId: sponsorId,
      previousStatus: null,
      newStatus: "PENDING",
    },
  });

  // Send alert to sponsor about new application
  const sponsorUsers = await prisma.sponsorUser.findMany({
    where: { sponsorId: sponsorId },
    select: { userId: true },
  });
  for (const sponsorUser of sponsorUsers) {
    await createAlert(
      sponsorUser.userId,
      "APPLICATION",
      `A new driver application has been submitted for your review.`,
    );
  }

  revalidatePath("/driver/apply");
  
  return { success: true };
}