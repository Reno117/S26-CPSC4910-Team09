"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const allowedStatuses = new Set(["pending", "active", "dropped", "disabled"]);

export async function updateDriverProfile(formData: FormData) {
  const admin = await requireAdmin();

  const driverId = String(formData.get("driverId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const imageInput = String(formData.get("image") ?? "").trim();
  const sponsorIdsInput = Array.from(
    new Set(
      formData
        .getAll("sponsorIds")
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
  const statusInput = String(formData.get("status") ?? "")
    .trim()
    .toLowerCase();

  if (!driverId || !name || !email) {
    redirect(`/admin/${driverId}?error=missing-required-fields`);
  }

  if (!allowedStatuses.has(statusInput)) {
    redirect(`/admin/${driverId}?error=invalid-status`);
  }

  const existingDriver = await prisma.driverProfile.findUnique({
    where: { id: driverId },
    select: { id: true, userId: true, status: true },
  });

  if (!existingDriver) {
    redirect(`/admin?error=driver-not-found`);
  }

  if (sponsorIdsInput.length > 0) {
    const sponsors = await prisma.sponsor.findMany({
      where: {
        id: {
          in: sponsorIdsInput,
        },
      },
      select: { id: true },
    });

    if (sponsors.length !== sponsorIdsInput.length) {
      redirect(`/admin/${driverId}?error=invalid-sponsor`);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existingDriver.userId },
      data: {
        name,
        email,
        image: imageInput || null,
      },
    });

    let finalSponsorIds = sponsorIdsInput;

    // If status is being changed to "active", approve any pending applications
    if (statusInput === "active" && existingDriver.status !== "active") {
      // Auto-assign sponsor from first application if not explicitly set
      if (finalSponsorIds.length === 0) {
        const approvedApp = await tx.driverApplication.findFirst({
          where: {
            driverProfileId: driverId,
          },
          orderBy: {
            createdAt: "asc",
          },
        });
        if (approvedApp) {
          finalSponsorIds = [approvedApp.sponsorId];
        }
      }

      await tx.driverApplication.updateMany({
        where: {
          driverProfileId: driverId,
          status: "pending",
        },
        data: {
          status: "approved",
          reviewedBy: admin.id,
        },
      });
    }

    await tx.driverProfile.update({
      where: { id: driverId },
      data: {
        sponsorId: finalSponsorIds[0] ?? null,
        status: statusInput,
      },
    });

    if (statusInput !== "pending") {
      const existingSponsorPoints = await tx.$queryRaw<{
        sponsorOrgId: string;
        points: number;
      }[]>`
        SELECT sponsorOrgId, points
        FROM sponsored_by
        WHERE driverId = ${driverId}
      `;
      const pointsBySponsorId = new Map(
        existingSponsorPoints.map((row) => [row.sponsorOrgId, Number(row.points)])
      );

      await tx.$executeRaw`
        DELETE FROM sponsored_by
        WHERE driverId = ${driverId}
      `;

      for (const sponsorOrgId of finalSponsorIds) {
        const points = pointsBySponsorId.get(sponsorOrgId) ?? 0;
        await tx.$executeRaw`
          INSERT INTO sponsored_by (id, driverId, sponsorOrgId, points, createdAt)
          VALUES (UUID(), ${driverId}, ${sponsorOrgId}, ${points}, NOW())
        `;
      }
    }

    // If status is being changed to "dropped", mark all applications as dropped
    if (statusInput === "dropped" && existingDriver.status !== "dropped") {
      await tx.driverApplication.updateMany({
        where: {
          driverProfileId: driverId,
          status: { not: "rejected" }, // Don't change rejected applications
        },
        data: {
          status: "dropped",
        },
      });
    }
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/${driverId}`);
  revalidatePath("/driver/apply");
  revalidatePath("/driver/profile");
  redirect(`/admin/${driverId}?saved=1`);
}
