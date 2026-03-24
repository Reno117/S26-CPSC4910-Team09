"use server";
import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function updateProductTitle(productId: string, title: string) {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();

  if (!title || title.trim() === "") {
    throw new Error("Title is required");
  }

  // Find the product first to check ownership
  const product = await prisma.catalogProduct.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Check authorization
  if (!isAdmin && product.sponsorId !== sponsorId) {
    throw new Error("Unauthorized");
  }

  // Update the product
  await prisma.catalogProduct.update({
    where: { id: productId },
    data: { title: title.trim() },
  });

  revalidatePath("/sponsor/catalog");
  revalidatePath("/admin/view-catalogs");
}