import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/auth-helpers";
import ApplicationForm from "@/app/components/driver-application-form";

export default async function ApplyPage() {
  const user = await requireDriver();

  // Get all sponsors
  const sponsors = await prisma.sponsor.findMany({
    orderBy: { name: "asc" },
  });

  // Get driver's existing applications
  const existingApplications = await prisma.driverApplication.findMany({
    where: {
      driverProfileId: user.driverProfile!.id,
    },
    include: {
      sponsor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Apply to Sponsor</h1>

      {/* Show existing applications */}
      {existingApplications.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Applications</h2>
          <div className="space-y-3">
            {existingApplications.map((app) => (
              <div
                key={app.id}
                className={`p-4 rounded border ${
                  app.status === "pending"
                    ? "bg-yellow-50 border-yellow-300"
                    : app.status === "approved"
                      ? "bg-green-50 border-green-300"
                      : "bg-red-50 border-red-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{app.sponsor.name}</h3>
                    <p className="text-sm text-gray-600">
                      Status:{" "}
                      <span className="font-semibold capitalize">
                        {app.status}
                      </span>
                    </p>
                    {app.reason && (
                      <p className="text-sm text-gray-600 mt-1">
                        Reason: {app.reason}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Apply to New Sponsor</h2>
        <ApplicationForm
          sponsors={sponsors}
          driverProfileId={user.driverProfile!.id}
        />
      </div>
    </div>
  );
}
