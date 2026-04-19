import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import CreateDriverForm from "@/app/components/create-driver-form";
import { getCurrentUser } from "@/lib/auth-helpers";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function CreateDriverPage() {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();
  const session = await auth.api.getSession({ headers: await headers() });

  const sponsors = isAdmin
    ? await prisma.sponsor.findMany({ orderBy: { name: "asc" } })
    : undefined;

  const userSettings = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { name: true, email: true, role: true, image: true },
  });

  if (!userSettings) return null;

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <SponsorHeader userSettings={userSettings} />
      <main className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Create New Driver
          </h1>
          <p className="text-sm text-black/70">
            Add a new driver to your organization.
          </p>
        </div>
        <CreateDriverForm
          isAdmin={isAdmin}
          sponsorId={sponsorId}
          sponsors={sponsors}
        />
      </main>
    </div>
  );
}