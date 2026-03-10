import Link from "next/link";
import AdminHeader from "@/app/components/AdminComponents/AdminHeader";
import { createSponsorOrg } from "@/app/actions/admin/create-sponsor-org";
import { requireAdmin } from "@/lib/auth-helpers";

interface CreateSponsorOrgPageProps {
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function CreateSponsorOrgPage({ searchParams }: CreateSponsorOrgPageProps) {
  await requireAdmin();
  const { saved, error } = await searchParams;

  return (
    <div>
      <AdminHeader />

      <main className="pt-24 px-6 min-h-screen flex flex-col items-center">
        <section className="w-full max-w-2xl bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Sponsor Organization</h1>
              <p className="text-sm text-gray-600">Create a new sponsor organization for drivers and sponsor users.</p>
            </div>
            <Link
              href="/admin"
              className="inline-flex rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
            >
              Back to Admin
            </Link>
          </div>

          {saved === "1" && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Sponsor organization created successfully.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to create sponsor organization. Please provide a valid name.
            </div>
          )}

          <form action={createSponsorOrg} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Organization Name</label>
              <input
                name="name"
                required
                placeholder="e.g. Acme Logistics"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
              />
            </div>

            <button
              type="submit"
              className="inline-flex rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create Sponsor Organization
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
