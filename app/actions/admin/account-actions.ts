"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function toggleDriverStatus(driverProfileId: string) {
  await requireAdmin();

  const driverProfile = await prisma.driverProfile.findUnique({
    where: { id: driverProfileId },
  });

  if (!driverProfile) {
    throw new Error("Driver profile not found");
  }

  // Toggle between active and disabled
  const newStatus = driverProfile.status === "disabled" ? "active" : "disabled";

  await prisma.driverProfile.update({
    where: { id: driverProfileId },
    data: { status: newStatus },
  });

  revalidatePath("/admin/users");

  return { success: true, newStatus };
}

export async function toggleSponsorStatus(sponsorUserId: string) {
  await requireAdmin();

  const sponsorUser = await prisma.sponsorUser.findUnique({
    where: { id: sponsorUserId },
  });

  if (!sponsorUser) {
    throw new Error("Sponsor user not found");
  }

  const newStatus = sponsorUser.status === "disabled" ? "active" : "disabled";

  await prisma.sponsorUser.update({
    where: { id: sponsorUserId },
    data: { status: newStatus },
  });

  revalidatePath("/admin/users");

  return { success: true, newStatus };
}

export async function toggleAdminStatus(adminId: string)
{
  await requireAdmin();

  const adminUser = await prisma.admin.findUnique({
    where: {userId: adminId},
  });

  if(!adminUser) {
    throw new Error("Admin user not found");
  }

  const newStatus = adminUser.status?.toLowerCase() === "disabled" ? "active" : "disabled";

  await prisma.admin.update({
    where: { id: adminUser.id },
    data: { status: newStatus },
  });
  revalidatePath("/admin/path");

  return {success: true, newStatus};
}