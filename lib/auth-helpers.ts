import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  return await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      driverProfile: true,
      sponsorUser: {
        include: {
          sponsor: true,
        },
      },
    },
  });
}

export async function requireSponsorUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Admins are always allowed
  if (user.role === "admin") {
    return user;
  }

  // Sponsors must have sponsorUser
  if (user.role !== "sponsor") {
    throw new Error("Unauthorized: Sponsor access required");
  }

  if (!user.sponsorUser) {
    throw new Error("Sponsor user profile not found");
  }

  return user;
}

export async function requireDriver() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Admins are always allowed
  if (user.role === "admin") {
    return user;
  }

  // Sponsors must have sponsorUser
  if (user.role !== "driver") {
    throw new Error("Unauthorized: Driver access required");
  }

  if (!user.driverProfile) {
    throw new Error("Driver profile not found");
  }

  return user;
}