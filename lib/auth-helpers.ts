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
  
  if (!user || user.role !== "sponsor") {
    throw new Error("Unauthorized: Sponsor access required");
  }
  
  if (!user.sponsorUser) {
    throw new Error("Sponsor user profile not found");
  }
  
  return user;
}

// NEW: Allow both sponsors and admins
export async function requireSponsorOrAdmin() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  if (user.role === "admin") {
    return { user, isAdmin: true, sponsorId: null };
  }
  
  if (user.role === "sponsor") {
    if (!user.sponsorUser) {
      throw new Error("Sponsor user profile not found");
    }
    return { user, isAdmin: false, sponsorId: user.sponsorUser.sponsorId };
  }
  
  throw new Error("Unauthorized: Sponsor or Admin access required");
}

export async function requireDriver() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "driver") {
    throw new Error("Unauthorized: Driver access required");
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  
  return user;
}

export async function getDriverStatus(): Promise<string | null> {
  const user = await getCurrentUser();
  
  if (!user || user.role !== "driver" || !user.driverProfile) {
    return null;
  }
  
  return user.driverProfile.status;
}