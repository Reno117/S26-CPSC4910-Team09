import { requireSponsorUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createSponsorUser } from "@/app/actions/sponsor/create-sponsor-user";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface CreateSponsorUserPageProps {
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function CreateSponsorUserPage({ searchParams }: CreateSponsorUserPageProps) {
  const currentUser = await requireSponsorUser();
  const { saved, error } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { name: true, email: true, role: true, image: true },
  });

  const sponsorUser = await prisma.sponsorUser.findFirst({
    where: { userId: currentUser.id },
    include: { sponsor: { select: { id: true, name: true } } },
  });

  if (!user) return null;

  if (!sponsorUser?.sponsor) {
    return (
      <div className="min-h-screen bg-[#e9eaeb] text-black">
        <SponsorHeader userSettings={user} />
        <main className="mx-auto max-w-2xl px-6 pt-24 pb-16">
          <p className="text-sm text-red-600">
            Your account is not linked to a sponsor organization. Contact an admin.
          </p>
        </main>
      </div>
    );
  }

  const { sponsor } = sponsorUser;

  const errorMessages: Record<string, string> = {
    "missing-required-fields": "Name and email are required.",
    "email-already-in-use": "That email is already registered.",
    "invalid-status": "Invalid status selected.",
    "no-sponsor-org": "Your account is not linked to a sponsor organization.",
  };

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <SponsorHeader userSettings={user} />

      <main className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Create Sponsor User
          </h1>
          <p className="text-sm text-black/70">
            Adding to: <span className="font-semibold text-black">{sponsor.name}</span>
          </p>
        </div>

        {saved === "1" && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Sponsor user created successfully.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessages[error] ?? "Unable to create user. Please check the form and try again."}
          </div>
        )}

        <form
          action={createSponsorUser}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-xl border border-black/10 shadow-sm p-6"
        >
          <div>
            <label className="block text-sm font-semibold text-black/80 mb-1">Name</label>
            <input
              name="name"
              required
              placeholder="e.g. Jordan Smith"
              className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm text-black outline-none focus:border-[#0d2b45]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black/80 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="e.g. jordan@example.com"
              className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm text-black outline-none focus:border-[#0d2b45]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black/80 mb-1">Image URL</label>
            <input
              name="image"
              placeholder="https://..."
              className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm text-black outline-none focus:border-[#0d2b45]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black/80 mb-1">Status</label>
            <select
              name="sponsorUserStatus"
              defaultValue="active"
              className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm text-black outline-none focus:border-[#0d2b45]"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div>
            <label className="inline-flex items-center gap-2 text-sm text-black/80 mt-6">
              <input name="emailVerified" type="checkbox" className="rounded border-black/20" />
              Email Verified
            </label>
          </div>

          <div className="md:col-span-2 rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm text-black/60">
            This user will be added to <strong className="text-black">{sponsor.name}</strong>. The organization is determined by your account and cannot be changed here.
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex rounded-lg bg-[#0d2b45] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-80 transition"
            >
              Create Sponsor User
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}