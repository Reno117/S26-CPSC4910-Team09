import { prisma } from "@/lib/prisma";

/**
 * Get catalog products for a driver's sponsor with point prices
 */
export async function getDriverCatalog(driverProfileId: string, sponsorIdOverride?: string) {
  const sponsorships = await prisma.sponsoredBy.findMany({
    where: { driverId: driverProfileId },
    include: {
      sponsorOrg: true,
    },
  });

  if (sponsorships.length === 0) {
    return { products: [], pointValue: 0.01, sponsorName: null };
  }

  const activeSponsor = sponsorIdOverride 
    ? sponsorships.find(s => s.sponsorOrgId === sponsorIdOverride)?.sponsorOrg
    : sponsorships[0].sponsorOrg;
  
  if(!activeSponsor) {
    return { products: [], pointValue: 0.01, sponsorName: null };
  }

  const products = await prisma.catalogProduct.findMany({
    where: {
      sponsorId: activeSponsor.id,
       isActive: true, // Only show active products
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    products,
    pointValue: activeSponsor.pointValue,
    sponsorName: activeSponsor.name,
  };
}

/**
 * Convert USD price to points
 */
export function calculatePointPrice(usdPrice: number, pointValue: number): number {
  return Math.ceil(usdPrice / pointValue);
}