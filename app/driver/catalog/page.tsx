import { getCurrentUser } from "@/lib/auth-helpers";
import { getDriverCatalog } from "@/lib/catalog-helpers";
import { convertToPoints } from "@/lib/ebay-api";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DriverCatalogPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  let products: any[] = [];
  let pointValue = 0.01;
  let sponsorName: string | null = null;
  let currentBalance = 0;
  let driverProfileId: string | null = null;
  let isViewingAsDriver = false;

  // DRIVER VIEW
  if (user.role === "driver") {
    const driverProfile = user.driverProfile;
    if (!driverProfile) {
      throw new Error("Driver profile not found");
    }

    const catalog = await getDriverCatalog(driverProfile.id);
    products = catalog.products;
    pointValue = catalog.pointValue;
    sponsorName = catalog.sponsorName;
    currentBalance = driverProfile.pointsBalance;
    driverProfileId = driverProfile.id;
    isViewingAsDriver = true;
  }
  
  // SPONSOR VIEW - see their own catalog
  else if (user.role === "sponsor") {
    const sponsorUser = user.sponsorUser;
    if (!sponsorUser) {
      throw new Error("Sponsor user profile not found");
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorUser.sponsorId },
    });

    products = await prisma.catalogProduct.findMany({
      where: {
        sponsorId: sponsorUser.sponsorId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    pointValue = sponsor?.pointValue || 0.01;
    sponsorName = sponsor?.name || null;
    isViewingAsDriver = false;
  }
  
  // ADMIN VIEW - see all products from all sponsors
  else if (user.role === "admin") {
    products = await prisma.catalogProduct.findMany({
      where: {
        isActive: true,
      },
      include: {
        sponsor: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Admin sees all, so we'll use default point value for display
    pointValue = 0.01;
    isViewingAsDriver = false;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {user.role === "admin" ? "All Products" : "Product Catalog"}
        </h1>
        {sponsorName && (
          <p className="text-gray-600">
            {user.role === "driver" ? `Products from ${sponsorName}` : sponsorName}
          </p>
        )}
        {user.role === "admin" && (
          <p className="text-gray-600">
            Viewing all products across all sponsors
          </p>
        )}
      </div>

      {/* Balance Display (Driver Only) */}
      {isViewingAsDriver && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg mb-8 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-sm mb-1">Your Point Balance</p>
              <p className="text-4xl font-bold">{currentBalance.toLocaleString()} points</p>
            </div>
            <Link
              href="/driver/cart"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}

      {/* No Sponsor Warning (Driver Only) */}
      {user.role === "driver" && !sponsorName ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">You are not affiliated with a sponsor yet.</p>
          <Link
            href="/driver/apply"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Apply to a Sponsor
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No products available yet.</p>
          {user.role === "sponsor" && (
            <Link
              href="/sponsor/catalog/add"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Products
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Product Count */}
          <div className="mb-4">
            <p className="text-gray-600">
              Showing {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              // Use product's sponsor pointValue if available (for admin view)
              const productPointValue = product.sponsor?.pointValue || pointValue;
              const pointPrice = convertToPoints(product.price, productPointValue); // Mock price for now
              const canAfford = isViewingAsDriver ? currentBalance >= pointPrice : true;

              return (
                <div
                  key={product.id}
                  className="bg-white border rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  {/* Image */}
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Admin: Show Sponsor Name */}
                    {user.role === "admin" && product.sponsor && (
                      <p className="text-xs text-blue-600 font-semibold mb-2">
                        {product.sponsor.name}
                      </p>
                    )}

                    <h3 className="font-semibold text-base mb-3 line-clamp-2 h-12">
                      {product.title}
                    </h3>

                    <div className="mb-4">
                      <p className="text-2xl font-bold text-green-600">
                        {pointPrice.toLocaleString()} points
                      </p>
                      {isViewingAsDriver && !canAfford && (
                        <p className="text-xs text-red-600 mt-1">
                          Need {(pointPrice - currentBalance).toLocaleString()} more points
                        </p>
                      )}
                    </div>

                    {/* Add to Cart Button (Driver Only) */}
                    {isViewingAsDriver ? (
                      <button
                        disabled={!canAfford}
                        className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
                          canAfford
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Add to Cart' : 'Insufficient Points'}
                      </button>
                    ) : (
                      <div className="text-center text-sm text-gray-500 py-2">
                        Preview Only
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}