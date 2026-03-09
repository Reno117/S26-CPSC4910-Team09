"use server";

import { prisma } from "@/lib/prisma"; // adjust to your prisma client path

export interface DriverSponsor {
  id: string;
  name: string;
  points: number;
  pointValue: number;
}

export async function getDriverSponsors(driverId: string): Promise<DriverSponsor[]> {
  const sponsorships = await prisma.sponsoredBy.findMany({
    where: {
      driverId,
    },
    include: {
      sponsorOrg: {
        select: {
          id: true,
          name: true,
          pointValue: true,
        },
      },
    },
  });

  return sponsorships.map((s) => ({
    id: s.sponsorOrg.id,
    name: s.sponsorOrg.name,
    points: s.points,
    pointValue: s.sponsorOrg.pointValue,
  }));
}
