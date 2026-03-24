import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/app/components/AdminComponents/AdminHeader";
import EbaySearchForm from "@/app/components/catalog/ebay-search-form";

interface AdminAddProductsPageProps {
  searchParams: Promise<{ sponsorId?: string }>;
}

export default async function AdminAddProductsPage({
  searchParams,
}: AdminAddProductsPageProps) {
  await requireAdmin();

  const { sponsorId } = await searchParams;

  const sponsors = await prisma.sponsor.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  const selectedSponsorId = sponsorId || null;

  return (
    <div>
      <AdminHeader />
      <main className="pt-24 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Products</h1>
          <p className="text-gray-600 mb-8">
            Search eBay and add items to a sponsor catalog.
          </p>

          <EbaySearchForm
            isAdmin={true}
            sponsorId={selectedSponsorId}
            sponsors={sponsors}
          />
        </div>
      </main>
    </div>
  );
}
