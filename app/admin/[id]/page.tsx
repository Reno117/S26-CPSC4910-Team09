import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminHeader from "../../components/AdminComponents/AdminHeader";
import { updateDriverProfile } from "@/app/actions/admin/update-driver-profile";
import Link from "next/link";
import DriverEditForm from "../../components/AdminComponents/DriverEditForm";
import ResetDriverPasswordForm from "@/app/components/AdminComponents/ResetDriverPasswordForm";

interface AdminDriverEditPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function AdminDriverEditPage({
  params,
  searchParams,
}: AdminDriverEditPageProps) {
  const { id } = await params;
  const { saved, error } = await searchParams;

  const [driver, sponsors, sponsorLinks] = await Promise.all([
    prisma.driverProfile.findUnique({
      where: { id },
      include: {
        user: true,
        sponsor: true,
      },
    }),
    prisma.sponsor.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.$queryRaw<{ sponsorOrgId: string; sponsorName: string }[]>`
      SELECT
        sb.sponsorOrgId,
        s.name AS sponsorName
      FROM sponsored_by sb
      INNER JOIN sponsor s ON s.id = sb.sponsorOrgId
      WHERE sb.driverId = ${id}
      ORDER BY s.name ASC
    `,
  ]);

  if (!driver) {
    notFound();
  }

  const selectedSponsorIds =
    sponsorLinks.length > 0
      ? sponsorLinks.map((link) => link.sponsorOrgId)
      : driver.sponsorId
        ? [driver.sponsorId]
        : [];

  return (
    <div>
      <AdminHeader />

      <main className="pt-24 px-6 min-h-screen flex flex-col items-center">
        <section className="w-full max-w-3xl bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Edit Driver Profile
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Update driver and user fields, then click save to permanently apply
            changes.
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            <Link
              href={`/admin/${driver.id}/orders`}
              className="inline-flex rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
            >
              View Order History
            </Link>
            <Link
              href={`/admin/${driver.id}/transactions`}
              className="inline-flex rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
            >
              View Point Transactions
            </Link>
          </div>

          {saved === "1" && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Driver profile updated successfully.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to save changes. Please verify the form values and try
              again.
            </div>
          )}

          <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">
              Current Sponsor Associations
            </h2>
            {sponsorLinks.length === 0 ? (
              <p className="text-sm text-gray-600">No sponsors associated.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sponsorLinks.map((link) => (
                  <span
                    key={link.sponsorOrgId}
                    className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"
                  >
                    {link.sponsorName}
                  </span>
                ))}
              </div>
            )}
          </div>

          <ResetDriverPasswordForm driverEmail={driver.user.email} />

          <DriverEditForm
            driver={driver}
            selectedSponsorIds={selectedSponsorIds}
            sponsors={sponsors}
            updateAction={updateDriverProfile}
          />
        </section>
      </main>
    </div>
  );
}
