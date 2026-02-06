"use server";

import { prisma } from "@/lib/prisma";
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

  // Create the application
  await prisma.driverApplication.create({
    data: {
      driverProfileId: driverProfileId,
      sponsorId: sponsorId,
      status: "pending",
    },
  });

  revalidatePath("/driver/apply");
  
  return { success: true };
}