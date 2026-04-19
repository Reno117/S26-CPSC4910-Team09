import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";
import DriverListClient from "@/app/components/SponsorComponents/DriverListClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function SponsorDashboard() {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();
  const session = await auth.api.getSession({ headers: await headers() });

  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { name: true, email: true, role: true, image: true },
  });

  const sponsor =
    !isAdmin && sponsorId
      ? await prisma.sponsor.findUnique({
          where: { id: sponsorId },
          select: { name: true },
        })
      : null;

  const sponsorUsers =
    !isAdmin && sponsorId
      ? await prisma.user.findMany({
          where: { sponsorUser: { sponsorId: sponsorId } },
          select: { id: true, name: true, email: true },
        })
      : [];

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
          user: { select: { id: true, name: true, email: true, image: true } },
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

      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        {/* Page heading */}
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {isAdmin ? "Admin Overview" : sponsor?.name ?? "Dashboard"}
          </h1>
          <p className="text-sm text-black/70">
            {isAdmin
              ? "Viewing all drivers and sponsor activity."
              : "Manage your sponsor users and registered drivers."}
          </p>
        </div>

        <div className="flex gap-6 items-start">
          {/* Sponsor Users */}
          {!isAdmin && (
            <div className="flex-1 bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-black/10">
                <h2 className="text-base font-semibold">Sponsor Users</h2>
              </div>
              {sponsorUsers.length === 0 ? (
                <p className="text-sm text-black/50 text-center py-8">
                  No sponsor users found.
                </p>
              ) : (
                <ul className="divide-y divide-black/10">
                  {sponsorUsers.map((u) => (
                    <li key={u.id} className="px-5 py-3 flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{u.name}</span>
                      <span className="text-xs text-black/50">{u.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Drivers */}
          <div className="flex-1 bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-black/10">
              <h2 className="text-base font-semibold">
                {isAdmin ? "All Registered Drivers" : "Registered Drivers"}
              </h2>
            </div>
            {drivers.length === 0 ? (
              <p className="text-sm text-black/50 text-center py-8">
                No registered drivers.
              </p>
            ) : (
              <DriverListClient drivers={drivers} isAdmin={isAdmin} initialCount={10} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}