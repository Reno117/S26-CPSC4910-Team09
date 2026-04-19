import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/auth-helpers";
import ApplicationForm from "@/app/components/DriverComponents/driver-application-form";
import DriverHeader from "@/app/components/DriverComponents/DriverHeader";

export default async function ApplyPage() {
  const user = await requireDriver();

  const sponsors = await prisma.sponsor.findMany({
    orderBy: { name: "asc" },
  });

  const existingApplications = await prisma.driverApplication.findMany({
    where: { driverProfileId: user.driverProfile!.id },
    include: {
      sponsor: true,
      reviewer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusStyles: Record<string, string> = {
    pending:  "bg-amber-50 border-amber-200",
    approved: "bg-emerald-50 border-emerald-200",
    dropped:  "bg-black/5 border-black/10",
    rejected: "bg-red-50 border-red-200",
  };

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <DriverHeader />

      <main className="mx-auto max-w-4xl px-6 pt-24 pb-16">
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Apply to Sponsor
          </h1>
          <p className="text-sm text-black/70">
            Submit an application to join a sponsor organization.
          </p>
        </div>

        {/* Existing applications */}
        {existingApplications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold mb-3">Your Applications</h2>
            <div className="space-y-3">
              {existingApplications.map((app) => (
                <div
                  key={app.id}
                  className={`p-4 rounded-xl border ${statusStyles[app.status] ?? "bg-black/5 border-black/10"}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-sm">{app.sponsor.name}</h3>
                      <p className="text-xs text-black/60 mt-0.5">
                        Status:{" "}
                        <span className="font-semibold capitalize">{app.status}</span>
                      </p>
                      {app.status === "approved" && app.reviewer && (
                        <p className="text-xs text-black/50 mt-1">
                          Approved by: {app.reviewer.name}
                        </p>
                      )}
                      {app.status === "dropped" && (
                        <p className="text-xs text-black/50 mt-1">
                          Your account was dropped. You can reapply below.
                        </p>
                      )}
                      {app.reason && (
                        <p className="text-xs text-black/50 mt-1">
                          Reason: {app.reason}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-black/40">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Application form */}
        <div className="bg-white rounded-xl border border-black/10 shadow-sm p-6">
          <h2 className="text-base font-semibold mb-4">Apply to New Sponsor</h2>
          <ApplicationForm
            sponsors={sponsors}
            driverProfileId={user.driverProfile!.id}
            existingApplications={existingApplications}
          />
        </div>
      </main>
    </div>
  );
}