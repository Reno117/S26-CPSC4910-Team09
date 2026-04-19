import DriverHeader from "@/app/components/DriverComponents/DriverHeader";
import PointsHistoryClient from "@/app/driver/pointshistory/PointsHistoryClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export default async function PointsHistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  let totalPointsBalance = 0;
  let sponsorBalances: {
    sponsorId: string;
    sponsorName: string;
    points: number;
  }[] = [];
  let transactions: {
    id: string;
    amount: number;
    reason: string;
    sponsorId: string;
    sponsorName: string;
    createdAt: string;
  }[] = [];

  if (session?.user?.id) {
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (driverProfile) {
      const sponsorshipTotals = await prisma.$queryRaw<{
        sponsorId: string;
        sponsorName: string;
        points: number;
      }[]>`
        SELECT
          s.id AS sponsorId,
          s.name AS sponsorName,
          sb.points
        FROM sponsored_by sb
        INNER JOIN sponsor s ON s.id = sb.sponsorOrgId
        WHERE sb.driverId = ${driverProfile.id}
        ORDER BY s.name ASC
      `;

      sponsorBalances = sponsorshipTotals.map((row) => ({
        sponsorId: row.sponsorId,
        sponsorName: row.sponsorName,
        points: Number(row.points),
      }));

      totalPointsBalance = sponsorBalances.reduce((sum, s) => sum + s.points, 0);

      const pointChanges = await prisma.pointChange.findMany({
        where: { driverProfileId: driverProfile.id },
        include: { sponsor: true },
        orderBy: { createdAt: "desc" },
      });

      transactions = pointChanges.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        reason: tx.reason,
        sponsorId: tx.sponsorId,
        sponsorName: tx.sponsor.name,
        createdAt: tx.createdAt.toISOString(),
      }));
    }
  }

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <DriverHeader />
      <main className="mx-auto max-w-6xl px-6 pt-05 pb-16">
        <PointsHistoryClient
          pointsBalance={totalPointsBalance}
          sponsorBalances={sponsorBalances}
          transactions={transactions}
        />
      </main>
    </div>
  );
}