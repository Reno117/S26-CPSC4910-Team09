"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAlert } from "@/app/actions/alerts/create-alert";
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

  // Get user info for alert
  const user = await prisma.user.findUnique({
    where: { id: driverProfile.userId },
    select: { id: true },
  });

  if (user) {
    const message = newStatus === "disabled" 
      ? "Your account has been disabled by an admin."
      : "Your account has been activated by an admin.";
    await createAlert(user.id, "STATUS", message);
  }

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

  // Send alert to sponsor about status change
  const statusMessages: Record<string, string> = {
    "active": "Your account has been activated by an admin.",
    "disabled": "Your account has been disabled by an admin.",
  };
  const message = statusMessages[newStatus] || `Your account status has been changed to ${newStatus} by an admin.`;
  await createAlert(sponsorUser.userId, "ADMIN_CHANGE", message);

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