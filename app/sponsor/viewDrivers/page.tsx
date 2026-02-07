import { prisma } from "@/lib/prisma";
import { requireSponsorUser } from "@/lib/auth-helpers";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import Link from "next/link";
import PointsButton from "@/app/components/SponsorComponents/points-button";

export default async function DriversPage() {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();

  // If admin, show ALL drivers from ALL sponsors
  // If sponsor, show only their drivers
  const drivers = await prisma.driverProfile.findMany({
    where: isAdmin
      ? { status: "active" } // Admin sees all drivers
      : { sponsorId: sponsorId!, status: "active" }, // Sponsor sees only their drivers
    include: {
      user: true,
      sponsor: true, // Include sponsor info for admin view
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Drivers</h1>

      {drivers.length === 0 ? (
        <p className="text-gray-500">No active drivers yet</p>
      ) : (
        <div className="grid gap-4">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="p-6 border rounded-lg hover:bg-gray-50 bg-white shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">{driver.user.name}</h3>
                  <p className="text-sm text-gray-600">{driver.user.email}</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {driver.pointsBalance} points
                  </p>
                </div>

                <PointsButton
                  driverProfileId={driver.id}
                  driverName={driver.user.name}
                  sponsorId={driver.sponsorId!}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
