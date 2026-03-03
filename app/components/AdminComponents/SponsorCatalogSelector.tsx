"use client";

import { useRouter } from "next/navigation";

interface Sponsor {
  id: string;
  name: string;
  pointValue: number;
  _count: {
    catalogProducts: number;
  };
}

interface CatalogProduct {
  id: string;
  ebayItemId: string;
  title: string;
  imageUrl: string | null;
  price: number;
  isActive: boolean;
  createdAt: Date;
}

interface SponsorCatalogSelectorProps {
  sponsors: Sponsor[];
  selectedSponsorId: string | null;
  catalogProducts: CatalogProduct[] | null;
  selectedSponsor: Sponsor | null | undefined;
}

export default function SponsorCatalogSelector({
  sponsors,
  selectedSponsorId,
  catalogProducts,
  selectedSponsor,
}: SponsorCatalogSelectorProps) {
  const router = useRouter();

  const handleSponsorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sponsorId = e.target.value;
    if (sponsorId) {
      router.push(`/admin/view-catalogs?sponsorId=${sponsorId}`);
    } else {
      router.push("/admin/view-catalogs");
    }
  };

  const activeCount = catalogProducts
    ? catalogProducts.filter((p) => p.isActive).length
    : 0;
  const inactiveCount = catalogProducts
    ? catalogProducts.filter((p) => !p.isActive).length
    : 0;

  return (
    <div>
      {/* Sponsor Selector */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Select Sponsor Organization
        </label>
        <select
          value={selectedSponsorId || ""}
          onChange={handleSponsorChange}
          className="w-full md:w-96 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
        >
          <option value="">-- Select a sponsor --</option>
          {sponsors.map((sponsor) => (
            <option key={sponsor.id} value={sponsor.id}>
              {sponsor.name} ({sponsor._count.catalogProducts} products)
            </option>
          ))}
        </select>
      </div>

      {/* Catalog Display */}
      {selectedSponsorId && selectedSponsor && catalogProducts && (
        <div>
          {/* Sponsor Info */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {selectedSponsor.name}
            </h2>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Point Conversion Rate:</span> $
              {selectedSponsor.pointValue.toFixed(2)} per point
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-semibold">Total Products:</span>{" "}
              {catalogProducts.length}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-blue-600">
                {catalogProducts.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-yellow-600">
                {inactiveCount}
              </p>
            </div>
          </div>

          {/* Products Grid */}
          {catalogProducts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600">
                This sponsor has no products in their catalog yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {catalogProducts.map((product) => {
                const pointPrice = Math.ceil(
                  product.price / selectedSponsor.pointValue
                );
                
                return (
                  <div
                    key={product.id}
                    className={`bg-white border rounded-lg shadow-sm overflow-hidden transition-opacity ${
                      !product.isActive ? "opacity-60" : ""
                    }`}
                  >
                    {/* Image */}
                    <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="max-h-full max-w-full object-contain p-2"
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">No image</div>
                      )}
                      {!product.isActive && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                          Inactive
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                        {product.title}
                      </h3>

                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Price:</span> $
                          {product.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Points:</span>{" "}
                          {pointPrice.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          eBay ID: {product.ebayItemId}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            product.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Instructions when no sponsor selected */}
      {!selectedSponsorId && (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="text-gray-600 text-lg">
            Select a sponsor organization above to view their catalog
          </p>
        </div>
      )}
    </div>
  );
}
