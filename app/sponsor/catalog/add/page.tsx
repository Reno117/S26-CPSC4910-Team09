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

  // If admin, fetch sponsors for dropdown
  const sponsors = isAdmin
    ? await prisma.sponsor.findMany({
        orderBy: { name: "asc" },
      })
    : undefined;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: {
      name: true,
      email: true,
      role: true,
      image: true,
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div>
      <SponsorHeader userSettings={user} />
      <div className="p-8 pt-24 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Add Products to Catalog</h1>
        <p className="text-gray-600 mb-8">
          Search eBay for products to add to your catalog. Your drivers will be
          able to redeem points for these items.
        </p>

        <EbaySearchForm
          isAdmin={isAdmin}
          sponsorId={effectiveSponsorId}
          sponsors={sponsors}
        />
      </div>
    </div>
  );
}
