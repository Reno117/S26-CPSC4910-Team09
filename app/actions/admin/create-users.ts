"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const allowedDriverStatuses = new Set(["pending", "active", "dropped", "disabled"]);
const allowedSponsorUserStatuses = new Set(["active", "disabled"]);

export async function createSingleUser(formData: FormData) {
  await requireAdmin();

  const userType = String(formData.get("userType") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const imageInput = String(formData.get("image") ?? "").trim();
  const emailVerifiedInput = String(formData.get("emailVerified") ?? "").trim().toLowerCase();
  const sponsorId = String(formData.get("sponsorId") ?? "").trim();
  const sponsorIdsInput = Array.from(
    new Set(
      formData
        .getAll("sponsorIds")
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
  const driverStatus = String(formData.get("driverStatus") ?? "active").trim().toLowerCase();
  const driverPointsBalanceInput = String(formData.get("driverPointsBalance") ?? "0").trim();
  const driverAddressInput = String(formData.get("driverAddress") ?? "").trim();
  const sponsorUserStatus = String(formData.get("sponsorUserStatus") ?? "active").trim().toLowerCase();

  if (!name || !email) {
    redirect("/admin/create-users?error=missing-required-fields");
  }

  if (userType !== "driver" && userType !== "sponsor") {
    redirect("/admin/create-users?error=invalid-user-type");
  }

  const emailVerified = emailVerifiedInput === "on";

  const driverPointsBalance = Number.parseInt(driverPointsBalanceInput || "0", 10);
  if (Number.isNaN(driverPointsBalance) || driverPointsBalance < 0) {
    redirect("/admin/create-users?error=invalid-driver-points-balance");
  }

  if (!allowedDriverStatuses.has(driverStatus)) {
    redirect("/admin/create-users?error=invalid-driver-status");
  }

  if (!allowedSponsorUserStatuses.has(sponsorUserStatus)) {
    redirect("/admin/create-users?error=invalid-sponsor-user-status");
  }

  if (userType === "sponsor" && !sponsorId) {
    redirect("/admin/create-users?error=missing-sponsor");
  }

  const sponsorIdsToValidate = userType === "driver" ? sponsorIdsInput : sponsorId ? [sponsorId] : [];
  if (sponsorIdsToValidate.length > 0) {
    const validSponsors = await prisma.sponsor.findMany({
      where: {
        id: {
          in: sponsorIdsToValidate,
        },
      },
      select: { id: true },
    });

    if (validSponsors.length !== sponsorIdsToValidate.length) {
      redirect("/admin/create-users?error=invalid-sponsor");
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    redirect("/admin/create-users?error=email-already-in-use");
  }

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name,
      email,
      role: userType,
      image: imageInput || null,
      emailVerified,
    },
    select: {
      id: true,
    },
  });

  if (userType === "driver") {
    const driverSponsorId = sponsorIdsInput[0] ?? null;
    const totalDriverPointsBalance =
      sponsorIdsInput.length > 0
        ? driverPointsBalance * sponsorIdsInput.length
        : driverPointsBalance;

    const driverProfile = await prisma.driverProfile.create({
      data: {
        userId: user.id,
        sponsorId: driverSponsorId,
        status: driverStatus,
        pointsBalance: totalDriverPointsBalance,
        address: driverAddressInput || null,
      },
      select: {
        id: true,
      },
    });

    if (sponsorIdsInput.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const selectedSponsorId of sponsorIdsInput) {
          await tx.$executeRaw`
            INSERT INTO sponsored_by (id, driverId, sponsorOrgId, points, createdAt)
            VALUES (UUID(), ${driverProfile.id}, ${selectedSponsorId}, ${driverPointsBalance}, NOW())
          `;
        }
      });
    }
  } else {
    await prisma.sponsorUser.create({
      data: {
        userId: user.id,
        sponsorId,
        status: sponsorUserStatus,
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/create-users");
  revalidatePath(`/admin/sponsor/${sponsorId}`);
  redirect("/admin/create-users?saved=1");
}
