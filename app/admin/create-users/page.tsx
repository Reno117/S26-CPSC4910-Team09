import Link from "next/link";
import AdminHeader from "@/app/components/AdminComponents/AdminHeader";
import { createSingleUser } from "@/app/actions/admin/create-users";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import CreateUsersForm from "@/app/components/AdminComponents/CreateUsersForm";

interface CreateUsersPageProps {
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function CreateUsersPage({ searchParams }: CreateUsersPageProps) {
  await requireAdmin();
  const { saved, error } = await searchParams;

  const sponsors = await prisma.sponsor.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div>
      <AdminHeader />

      <main className="pt-24 px-6 min-h-screen flex flex-col items-center">
        <section className="w-full max-w-3xl bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create User</h1>
              <p className="text-sm text-gray-600">Create a single driver, sponsor, or admin user account.</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/mass-upload-users"
                className="inline-flex rounded-md bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-300"
              >
                Mass Upload Users
              </Link>
              <Link
                href="/admin"
                className="inline-flex rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
              >
                Back to Admin
              </Link>
            </div>
          </div>

          {saved === "1" && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              User created successfully.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to create user. Check required fields, sponsor selection, and email uniqueness.
            </div>
          )}

          <CreateUsersForm sponsors={sponsors} action={createSingleUser} />
        </section>
      </main>
    </div>
  );
}
