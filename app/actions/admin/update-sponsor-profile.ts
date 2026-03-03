"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateSponsorProfile(formData: FormData) {
  const admin = await requireAdmin();

  const sponsorUserId = String(formData.get("sponsorUserId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const imageInput = String(formData.get("image") ?? "").trim();
  const sponsorIdInput = String(formData.get("sponsorId") ?? "").trim();

  if (!sponsorUserId || !name || !email) {
    redirect(`/admin/sponsor/${sponsorUserId}?error=missing-required-fields`);
  }

  const existingSponsorUser = await prisma.sponsorUser.findUnique({
    where: { id: sponsorUserId },
    select: { id: true, userId: true, sponsorId: true },
  });

  if (!existingSponsorUser) {
    redirect(`/admin?error=sponsor-not-found`);
  }

  // Validate sponsor exists if provided
  let newSponsorId: string | null = existingSponsorUser.sponsorId;
  if (sponsorIdInput) {
    const sponsorExists = await prisma.sponsor.findUnique({
      where: { id: sponsorIdInput },
      select: { id: true },
    });

    if (!sponsorExists) {
      redirect(`/admin/sponsor/${sponsorUserId}?error=invalid-sponsor`);
    }
    newSponsorId = sponsorIdInput;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existingSponsorUser.userId },
      data: {
        name,
        email,
        image: imageInput || null,
      },
    });
    await tx.sponsorUser.update({
      where: { id: sponsorUserId },
      data: {
        sponsorId: newSponsorId,
      },
    });
  });

  revalidatePath("/admin");
  redirect(`/admin/sponsor/${sponsorUserId}?saved=1`);
}
