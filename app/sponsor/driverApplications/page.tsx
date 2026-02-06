import { prisma } from "@/lib/prisma";
import { requireSponsorUser } from "@/lib/auth-helpers";
import ApplicationCard from "@/app/components/driver-application-card";

export default async function ApplicationsPage() {
  const sponsorUser = await requireSponsorUser();
  const sponsorId = sponsorUser.sponsorUser!.sponsorId;

  const applications = await prisma.driverApplication.findMany({
    where: {
      sponsorId: sponsorId,
      status: "pending",
    },
    include: {
      driverProfile: {
        include: {
          user: true,
        },
      },
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