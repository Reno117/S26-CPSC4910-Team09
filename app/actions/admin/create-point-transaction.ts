"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createAdminPointTransaction(formData: FormData) {
  const adminUser = await requireAdmin();

  const driverId = String(formData.get("driverId") ?? "").trim();
  const sponsorId = String(formData.get("sponsorId") ?? "").trim();
  const amountInput = String(formData.get("amount") ?? "").trim();
  const reasonInput = String(formData.get("reason") ?? "").trim();

  if (!driverId) {
    redirect("/admin?error=missing-driver-id");
  }

  const amount = Number.parseInt(amountInput, 10);
  if (Number.isNaN(amount) || amount === 0) {
    redirect(`/admin/${driverId}/transactions?error=invalid-amount`);
  }

  if (!reasonInput) {
    redirect(`/admin/${driverId}/transactions?error=missing-reason`);
  }

  if (!sponsorId) {
    redirect(`/admin/${driverId}/transactions?error=missing-sponsor`);
  }

  const driver = await prisma.driverProfile.findUnique({
    where: { id: driverId },
    select: {
      id: true,
    },
  });

  if (!driver) {
    redirect(`/admin?error=driver-not-found`);
  }

  const sponsorship = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM sponsored_by
    WHERE driverId = ${driverId}
      AND sponsorOrgId = ${sponsorId}
    LIMIT 1
  `;

  if (sponsorship.length === 0) {
    redirect(`/admin/${driverId}/transactions?error=invalid-sponsor-selection`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.driverProfile.update({
      where: { id: driverId },
      data: {
        pointsBalance: {
          increment: amount,
        },
      },
    });

    await tx.$executeRaw`
      UPDATE sponsored_by
      SET points = points + ${amount}
      WHERE driverId = ${driverId}
        AND sponsorOrgId = ${sponsorId}
    `;

    await tx.pointChange.create({
      data: {
        driverProfileId: driverId,
        sponsorId,
        amount,
        reason: `Admin adjustment: ${reasonInput}`,
        changedBy: adminUser.id,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/${driverId}`);
  revalidatePath(`/admin/${driverId}/transactions`);
  redirect(`/admin/${driverId}/transactions?saved=1`);
}
