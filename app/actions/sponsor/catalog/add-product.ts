"use server";

import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function addProductToCatalog(data: {
  ebayItemId: string;
  title: string;
  imageUrl: string;
  price: number; // ADD THIS
  sponsorId?: string; // For admins to specify which sponsor
}) {
  const { isAdmin, sponsorId: userSponsorId } = await requireSponsorOrAdmin();

  // Determine target sponsor
  const targetSponsorId =
    isAdmin && data.sponsorId ? data.sponsorId : userSponsorId!;

  // Check if product already exists in this sponsor's catalog
  const existing = await prisma.catalogProduct.findUnique({
    where: {
      sponsorId_ebayItemId: {
        sponsorId: targetSponsorId,
        ebayItemId: data.ebayItemId,
      },
    },
  });

  if (existing) {
    throw new Error("This product is already in your catalog");
  }

  // Add to catalog
  await prisma.catalogProduct.create({
    data: {
      sponsorId: targetSponsorId,
      ebayItemId: data.ebayItemId,
      title: data.title,
      imageUrl: data.imageUrl,
      price: data.price, // ADD THIS
      isActive: true,
    },
  });

  revalidatePath("/sponsor/catalog");

  return { success: true };
}
