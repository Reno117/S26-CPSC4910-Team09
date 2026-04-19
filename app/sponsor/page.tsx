import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import DriverLists from "../components/SponsorComponents/driver-list";
import SponsorHeader from "../components/SponsorComponents/SponsorHeader"; 
import DriverListClient from "../components/SponsorComponents/DriverListClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function SponsorDashboard() {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { id: true, name: true, email: true, role: true, image: true },
  });

  const drivers = await prisma.sponsoredBy.findMany({
    where: isAdmin ? {} : { sponsorOrgId: sponsorId! },
    select: {
      id: true,
      points: true,
      sponsorOrgId: true,
      createdAt: true,
      driver: {
        select: {
          id: true,
          status: true,
          pointsBalance: true,
          user: {
            select: { name: true, email: true, image: true, id: true },
          },
        },
      },
      sponsorOrg: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <SponsorHeader userSettings={user} />

      <main className="pt-24 px-6 min-h-screen flex flex-col items-center">
        <div className="w-full max-w-6xl">
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              {isAdmin ? "All Drivers" : "Your Drivers"}
            </h1>
            <p className="text-sm text-black/70">
              {isAdmin
                ? "Viewing all registered drivers across sponsors."
                : "Manage and view your registered drivers."}
            </p>
          </div>

          {drivers.length === 0 ? (
            <p className="text-sm text-black/50">No registered drivers found.</p>
          ) : (
            <DriverListClient drivers={drivers} isAdmin={isAdmin} initialCount={10} />
          )}
        </div>
      </main>
    </div>
  );
}