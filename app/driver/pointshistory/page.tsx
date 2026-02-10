import DriverHeader from "@/app/components/DriverComponents/DriverHeader";
import PointsHistoryClient from "@/app/driver/pointshistory/PointsHistoryClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export default async function PointsHistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let pointsBalance = 0;
  let transactions: {
    id: string;
    amount: number;
    reason: string;
    sponsorName: string;
    createdAt: string;
  }[] = [];

  if (session?.user?.id) {
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: session.user.id },
    });
    pointsBalance = driverProfile?.pointsBalance || 0;

    if (driverProfile) {
      const pointChanges = await prisma.pointChange.findMany({
        where: { driverProfileId: driverProfile.id },
        include: { sponsor: true },
        orderBy: { createdAt: "desc" },
      });

      transactions = pointChanges.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        reason: tx.reason,
        sponsorName: tx.sponsor.name,
        createdAt: tx.createdAt.toISOString(),
      }));
    }
  }

  return (
    <div>
      <DriverHeader />
      <PointsHistoryClient
        pointsBalance={pointsBalance}
        transactions={transactions}
      />
    </div>
  );
}
