"use server";
 
import { requireSponsorUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
 
const allowedSponsorUserStatuses = new Set(["active", "disabled"]);
 
export async function createSponsorUser(formData: FormData) {
  // Get the currently logged-in sponsor user and resolve their sponsorId
  const currentUser = await requireSponsorUser();
 
  const sponsorUser = await prisma.sponsorUser.findFirst({
    where: { userId: currentUser.id },
    select: { sponsorId: true },
  });
 
  if (!sponsorUser?.sponsorId) {
    redirect("/sponsor/create-user?error=no-sponsor-org");
  }
 
  const { sponsorId } = sponsorUser;
 
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const imageInput = String(formData.get("image") ?? "").trim();
  const emailVerifiedInput = String(formData.get("emailVerified") ?? "").trim().toLowerCase();
  const sponsorUserStatus = String(formData.get("sponsorUserStatus") ?? "active").trim().toLowerCase();
 
  if (!name || !email) {
    redirect("/sponsor/create-user?error=missing-required-fields");
  }
 
  if (!allowedSponsorUserStatuses.has(sponsorUserStatus)) {
    redirect("/sponsor/create-user?error=invalid-status");
  }
 
  const emailVerified = emailVerifiedInput === "on";
 
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
 
  if (existingUser) {
    redirect("/sponsor/create-user?error=email-already-in-use");
  }
 
  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name,
      email,
      role: "sponsor",
      image: imageInput || null,
      emailVerified,
    },
    select: { id: true },
  });
 
  await prisma.alertPreferences.create({
    data: {
      adminChangeAlert: true,
      applicationAlert: true,
      orderAlert: true,
      passwordChangeAlert: true,
      pointChangeAlert: true,
      statusAlert: true,
      userId: user.id,
    },
  });
 
  await prisma.sponsorUser.create({
    data: {
      userId: user.id,
      sponsorId,
      status: sponsorUserStatus,
    },
  });
 
  revalidatePath("/sponsor");
  revalidatePath("/sponsor/create-user");
  redirect("/sponsor/create-user?saved=1");
}