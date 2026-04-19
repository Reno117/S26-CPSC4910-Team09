import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSponsorOrAdmin } from "@/lib/auth-helpers";
import ApplicationCard from "@/app/components/DriverComponents/driver-application-card";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";

export default async function ApplicationsPage() {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();
  const currentUser = await getCurrentUser();
  const applications = await prisma.driverApplication.findMany({
    where: isAdmin
      ? { status: "pending" }
      : { sponsorId: sponsorId!, status: "pending" },
    include: {
      driverProfile: {
        include: {
          user: true,
        },
      },
      sponsor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <SponsorHeader userSettings={{
        name: currentUser?.name ?? "",
        email: currentUser?.email ?? "",
        role: currentUser?.role ?? "",
        image: currentUser?.image ?? "",
      }}/>
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Pending Applications
          </h1>
          <p className="text-sm text-black/70">
            {isAdmin ? "All pending driver applications across sponsors." : "Pending driver applications for your organization."}
          </p>
        </div>

        {applications.length === 0 ? (
          <p className="text-sm text-black/50">No pending applications.</p>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}