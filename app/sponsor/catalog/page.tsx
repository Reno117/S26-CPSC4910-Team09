import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import Link from "next/link";
import CatalogActions from "@/app/components/catalog/catalog-actions";
import CatalogSearch from "@/app/components/catalog/search-catalog";
import ProductCard from "@/app/components/catalog/catalog-product-card";
import UpdatePointsModal from "@/app/components/catalog/edit-pointconversion-button";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();

  let pointConversion = null;
  if (sponsorId) {
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      select: { pointValue: true },
    });
    pointConversion = sponsor?.pointValue ?? null;
  }

  const { search } = await searchParams;
  const searchQuery = search || "";

  const products = await prisma.catalogProduct.findMany({
    where: {
      ...(isAdmin ? {} : { sponsorId: sponsorId! }),
      ...(searchQuery
        ? {
            OR: [
              { title: { contains: searchQuery } },
              { ebayItemId: { contains: searchQuery } },
            ],
          }
        : {}),
    },
    include: { sponsor: true },
    orderBy: { createdAt: "desc" },
  });

  const session = await auth.api.getSession({ headers: await headers() });
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { name: true, email: true, role: true, image: true },
  });

  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <SponsorHeader userSettings={user} />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">

        {/* Page header */}
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              {isAdmin ? "All Product Catalogs" : "Product Catalog"}
            </h1>
            <p className="text-sm text-black/70">
              Manage products that drivers can redeem with points.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <UpdatePointsModal itemId={sponsorId} pointConversion={pointConversion} />
            <Link
              href="/sponsor/catalog/add"
              className="bg-[#0d2b45] text-white px-5 py-2.5 rounded-lg hover:opacity-80 transition text-sm font-medium"
            >
              + Add Products
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <CatalogSearch initialSearch={searchQuery} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">Total Products</p>
            <p className="text-2xl font-semibold text-[#0d2b45]">{products.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">Active</p>
            <p className="text-2xl font-semibold text-emerald-600">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">Inactive</p>
            <p className="text-2xl font-semibold text-amber-500">{inactiveCount}</p>
          </div>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-black/10 shadow-sm">
            <p className="text-sm text-black/50 mb-4">
              {searchQuery ? "No products found matching your search." : "No products yet."}
            </p>
            {!searchQuery && (
              <Link
                href="/sponsor/catalog/add"
                className="inline-block bg-[#0d2b45] text-white px-6 py-2 rounded-lg hover:opacity-80 transition text-sm"
              >
                Add Your First Product
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}