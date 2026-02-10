import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import ApplicationCard from "@/app/components/driver-application-card";

export default async function ApplicationsPage() {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();

  const applications = await prisma.driverApplication.findMany({
    where: isAdmin
      ? { status: "pending" } // Admin sees all pending applications
      : { sponsorId: sponsorId!, status: "pending" }, // Sponsor sees only theirs
    include: {
      driverProfile: {
        include: {
          user: true,
        },
      },
      sponsor: true, // Include sponsor name for admin view
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Pending Applications</h1>
      
      {applications.length === 0 ? (
        <p className="text-gray-500">No pending applications</p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
}