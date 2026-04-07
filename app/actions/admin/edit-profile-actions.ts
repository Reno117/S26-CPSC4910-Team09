"use server";
 
import { prisma } from "@/lib/prisma";
import { createAlert } from "@/app/actions/alerts/create-alert";
import { revalidatePath } from "next/cache";
 
// ─── Driver Actions ───────────────────────────────────────────────────────────
 
export type UpdateDriverInput = {
  driverProfileId: string;
  address?: string;
  status?: string;
  sponsorId?: string | null;
  userName?: string;
  userEmail?: string;
  reason?: string;
};
 
export async function updateDriverProfile(input: UpdateDriverInput) {
  const { driverProfileId, address, status, sponsorId, userName, userEmail, reason } = input;
 
  const profile = await prisma.driverProfile.findUniqueOrThrow({
    where: { id: driverProfileId },
    include: { user: true },
  });
 
  const previousStatus = profile.status;
 
  await prisma.driverProfile.update({
    where: { id: driverProfileId },
    data: {
      ...(address !== undefined && { address }),
      ...(status !== undefined && { status }),
      ...(sponsorId !== undefined && { sponsorId }),
    },
  });
 
  if (userName !== undefined || userEmail !== undefined) {
    await prisma.user.update({
      where: { id: profile.userId },
      data: {
        ...(userName !== undefined && { name: userName }),
        ...(userEmail !== undefined && { email: userEmail }),
      },
    });
  }
 
  if (status !== undefined && status !== previousStatus) {
    await prisma.driverStatusLog.create({
      data: {
        driverId: driverProfileId,
        previousStatus,
        newStatus: status,
        changeReason: reason ?? "Updated by admin",
      },
    });
  }
 
  const changedFields: string[] = [];
  if (address !== undefined) changedFields.push("address");
  if (status !== undefined && status !== previousStatus) changedFields.push(`status → ${status}`);
  if (sponsorId !== undefined) changedFields.push("sponsor assignment");
  if (userName !== undefined) changedFields.push("name");
  if (userEmail !== undefined) changedFields.push("email");
 
  if (changedFields.length > 0) {
    await createAlert(
      profile.userId,
      "ADMIN_CHANGE",
      `An admin updated your profile: ${changedFields.join(", ")}.${reason ? ` Reason: ${reason}` : ""}`
    );
  }
 
  revalidatePath("/admin/edit-profiles");
}
 
// ─── Sponsor User Actions ─────────────────────────────────────────────────────
 
export type UpdateSponsorUserInput = {
  sponsorUserId: string;
  userName?: string;
  userEmail?: string;
  status?: string;
  reason?: string;
};
 
export async function updateSponsorUser(input: UpdateSponsorUserInput) {
  const { sponsorUserId, userName, userEmail, status, reason } = input;
 
  const sponsorUser = await prisma.sponsorUser.findUniqueOrThrow({
    where: { id: sponsorUserId },
    include: { user: true, sponsor: true },
  });
 
  if (userName !== undefined || userEmail !== undefined) {
    await prisma.user.update({
      where: { id: sponsorUser.userId },
      data: {
        ...(userName !== undefined && { name: userName }),
        ...(userEmail !== undefined && { email: userEmail }),
      },
    });
  }
 
  if (status !== undefined) {
    await prisma.sponsorUser.update({
      where: { id: sponsorUserId },
      data: { status },
    });
  }
 
  const changedFields: string[] = [];
  if (userName !== undefined) changedFields.push("name");
  if (userEmail !== undefined) changedFields.push("email");
  if (status !== undefined && status !== sponsorUser.status) changedFields.push(`status → ${status}`);
 
  if (changedFields.length > 0) {
    await createAlert(
      sponsorUser.userId,
      "ADMIN_CHANGE",
      `An admin updated your sponsor account: ${changedFields.join(", ")}.${reason ? ` Reason: ${reason}` : ""}`
    );
  }
 
  revalidatePath("/admin/edit-profiles");
}
 
// ─── Data Fetching ────────────────────────────────────────────────────────────
 
export async function getDriversWithProfiles() {
  return prisma.driverProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      sponsor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
 
export async function getSponsorUsers() {
  return prisma.sponsorUser.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      sponsor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
 
export async function getAllSponsorsForSelect() {
  return prisma.sponsor.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}