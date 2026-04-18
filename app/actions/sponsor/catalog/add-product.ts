"use server";

import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

function normalizeExternalImageUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return "";

  return `https://${trimmed}`;
}

export async function addProductToCatalog(data: {
  ebayItemId: string;
  title: string;
  imageUrl: string;
  price: number; // ADD THIS
  sponsorId?: string; // For admins to specify which sponsor
}) {
  const { isAdmin, sponsorId: userSponsorId } = await requireSponsorOrAdmin();
  const normalizedImageUrl = normalizeExternalImageUrl(data.imageUrl);

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
      imageUrl: normalizedImageUrl,
      price: data.price, // ADD THIS
      isActive: true,
    },
  });

  revalidatePath("/sponsor/catalog");

  return { success: true };
}
