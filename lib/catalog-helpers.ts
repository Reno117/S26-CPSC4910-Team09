import { prisma } from "@/lib/prisma";

/**
 * Get catalog products for a driver's sponsor with point prices
 */
export async function getDriverCatalog(driverProfileId: string) {
  const driverProfile = await prisma.driverProfile.findUnique({
    where: { id: driverProfileId },
    include: {
      sponsor: true,
    },
  });

  if (!driverProfile || !driverProfile.sponsorId) {
    return { products: [], pointValue: 0.01, sponsorName: null };
  }

  const products = await prisma.catalogProduct.findMany({
    where: {
      sponsorId: driverProfile.sponsorId,
      isActive: true, // Only show active products
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    products,
    pointValue: driverProfile.sponsor!.pointValue,
    sponsorName: driverProfile.sponsor!.name,
  };
}

/**
 * Convert USD price to points
 */
export function calculatePointPrice(usdPrice: number, pointValue: number): number {
  return Math.ceil(usdPrice / pointValue);
}