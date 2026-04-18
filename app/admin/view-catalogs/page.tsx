import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import AdminHeader from "../../components/AdminComponents/AdminHeader";
import SponsorCatalogSelector from "../../components/AdminComponents/SponsorCatalogSelector";
import UpdatePointsModal from "@/app/components/catalog/edit-pointconversion-button";

// Fix the interface
interface ViewCatalogsPageProps {
  searchParams: Promise<{ sponsorId?: string | null }>;
}

export default async function ViewCatalogsPage({ searchParams }: ViewCatalogsPageProps) {
  await requireAdmin();
  
  const { sponsorId } = await searchParams;

  // Fetch all sponsors
  const sponsors = await prisma.sponsor.findMany({
    select: {
      id: true,
      name: true,
      pointValue: true,
      _count: {
        select: {
          catalogProducts: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch catalog products for selected sponsor
  let catalogProducts = null;
  let selectedSponsor = null;

  if (sponsorId) {
    selectedSponsor = sponsors.find((s) => s.id === sponsorId);
    
    catalogProducts = await prisma.catalogProduct.findMany({
      where: {
        sponsorId: sponsorId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  return (
    <div>
      <AdminHeader />

      <main className="pt-24 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            View Sponsor Catalogs
          </h1>
          <p className="text-gray-600 mb-8">
            Select a sponsor organization to view their product catalog
          </p>
          <div>

            <UpdatePointsModal itemId={sponsorId ?? null} pointConversion={null} />
          </div>

          <SponsorCatalogSelector
            sponsors={sponsors}
            selectedSponsorId={sponsorId || null}
            catalogProducts={catalogProducts}
            selectedSponsor={selectedSponsor}
          />
        </div>
      </main>
    </div>
  );
}
