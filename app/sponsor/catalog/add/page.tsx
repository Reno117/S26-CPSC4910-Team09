import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import EbaySearchForm from "@/app/components/catalog/ebay-search-form";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface AddProductsPageProps {
  searchParams: Promise<{ sponsorId?: string }>;
}

export default async function AddProductsPage({ searchParams }: AddProductsPageProps) {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();
  const { sponsorId: requestedSponsorId } = await searchParams;

  const effectiveSponsorId = isAdmin ? (requestedSponsorId || null) : sponsorId;

  const sponsors = isAdmin
    ? await prisma.sponsor.findMany({ orderBy: { name: "asc" } })
    : undefined;

  const session = await auth.api.getSession({ headers: await headers() });

  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { name: true, email: true, role: true, image: true },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <SponsorHeader userSettings={user} />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Add Products to Catalog
          </h1>
          <p className="text-sm text-black/70">
            Search eBay for products to add to your catalog. Your drivers will
            be able to redeem points for these items.
          </p>
        </div>

        <EbaySearchForm
          isAdmin={isAdmin}
          sponsorId={effectiveSponsorId}
          sponsors={sponsors}
        />
      </main>
    </div>
  );
}