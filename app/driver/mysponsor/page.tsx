import DriverHeader from "@/app/components/DriverComponents/DriverHeader";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export default async function MySponsorPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let sponsorName: string | null = null;

  if (session?.user?.id) {
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: session.user.id },
      include: { sponsor: true },
    });

    sponsorName = driverProfile?.sponsor?.name ?? null;
  }

  return (
    <div>
      <DriverHeader />
      <div className="pt-16 p-8">
        <h1 className="text-3xl font-bold mb-4">My Sponsor</h1>
        {sponsorName ? (
          <p className="text-lg text-gray-800">{sponsorName}</p>
        ) : (
          <p className="text-gray-500">No sponsor assigned yet.</p>
        )}
      </div>
    </div>
  );
}
