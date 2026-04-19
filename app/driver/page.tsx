import DriverHeader from "../components/DriverComponents/DriverHeader";
import { auth } from "@/lib/auth";
import { checkDriverNotDisabled } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Link from "next/link";

export default async function DriverDashboard() {
  await checkDriverNotDisabled();
  const session = await auth.api.getSession({ headers: await headers() });

  let pointHistory: any[] = [];
  let sponsorships: any[] = [];
  let sponsors: { id: string; name: string }[] = [];

  try {
    if (session?.user?.id) {
      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          sponsorships: { include: { sponsorOrg: true } },
        },
      });

      if (driverProfile?.status === "pending") {
        return (
          <div className="min-h-screen bg-[#e9eaeb] flex flex-col items-center justify-center gap-4 px-4">
            <h1 className="text-3xl font-semibold">Unauthorized</h1>
            <p className="text-black/60 text-center max-w-xl text-sm">
              Your driver application is still pending. You cannot access the
              driver dashboard until it is approved.
            </p>
          </div>
        );
      }

      if (driverProfile) {
        sponsorships = await prisma.sponsoredBy.findMany({
          where: { driverId: driverProfile.id },
          include: { sponsorOrg: true },
        });

        sponsors = driverProfile.sponsorships.map((s) => ({
          id: s.sponsorOrg.id,
          name: s.sponsorOrg.name,
        }));

        pointHistory = await prisma.pointChange.findMany({
          where: { driverProfileId: driverProfile.id },
          include: { changedByUser: true, sponsor: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        });
      }
    }
  } catch (error) {
    console.error("Database connection error:", error);
  }

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <DriverHeader />

      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16 space-y-6">

        {/* Top row — Stats + Sponsors */}
        <div className="flex gap-6">
          {/* Points per sponsor */}
          <div className="flex-1 bg-white rounded-xl border border-black/10 shadow-sm p-6">
            <h2 className="text-base font-semibold mb-4">Driver Stats</h2>
            {sponsorships.length === 0 ? (
              <p className="text-sm text-black/50">No active sponsorships.</p>
            ) : (
              <div className="space-y-3">
                {sponsorships.map((s) => (
                  <div key={s.id} className="rounded-lg border border-black/10 bg-black/5 p-4">
                    <p className="text-xs text-black/50 uppercase tracking-wide mb-1">
                      {s.sponsorOrg.name}
                    </p>
                    <p className="text-3xl font-semibold text-[#0d2b45]">
                      {s.points.toLocaleString()} pts
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Sponsors */}
          <div className="flex-1 bg-white rounded-xl border border-black/10 shadow-sm p-6">
            <h2 className="text-base font-semibold mb-4">My Sponsors</h2>
            {sponsors.length === 0 ? (
              <div>
                <p className="text-sm text-black/50 mb-4">No sponsor assigned yet.</p>
                <Link
                  href="/driver/apply"
                  className="inline-block bg-[#0d2b45] text-white px-5 py-2 rounded-lg hover:opacity-80 transition text-sm"
                >
                  Apply to a Sponsor
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="rounded-lg border border-black/10 bg-black/5 p-4 flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{sponsor.name}</span>
                    <Link
                      href={`/driver/catalog?sponsorId=${sponsor.id}`}
                      className="text-xs text-[#0d2b45] font-semibold hover:opacity-70 transition"
                    >
                      View Catalog →
                    </Link>
                  </div>
                ))}
                <Link
                  href="/driver/apply"
                  className="inline-block text-xs text-black/40 hover:text-black/70 transition mt-1"
                >
                  + Apply to another sponsor
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions — full width */}
        <div className="bg-white rounded-xl border border-black/10 shadow-sm p-6">
          <h2 className="text-base font-semibold mb-4">Recent Transactions</h2>
          {pointHistory.length === 0 ? (
            <p className="text-sm text-black/50">No transactions yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pointHistory.map((change) => (
                <div
                  key={change.id}
                  className="bg-black/5 rounded-lg border border-black/10 p-4"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-xl font-semibold ${
                        change.amount > 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {change.amount > 0 ? "+" : ""}{change.amount} pts
                    </span>
                    <span className="text-xs text-black/40">
                      {new Date(change.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-black/70 mb-1">{change.reason}</p>
                  <p className="text-xs text-black/40">
                    By: {change.changedByUser.name} ({change.sponsor.name})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}