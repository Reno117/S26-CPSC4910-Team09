import { getCurrentUser } from "@/lib/auth-helpers";
import { getDriverCatalog } from "@/lib/catalog-helpers";
import { convertToPoints } from "@/lib/ebay-api";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AddToCartButton from "@/app/components/catalog/add-to-cart-button";
import DriverHeader from "@/app/components/DriverComponents/DriverHeader";


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

  const isNewProduct = (createdAt: Date) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(createdAt) > sevenDaysAgo;
  };

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

    pointValue = 0.01;
    isViewingAsDriver = false;
  }

  return (
    <div>
      <DriverHeader />
      <div className="p-8 pt-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {user.role === "admin" ? "All Products" : "Product Catalog"}
        </h1>
        {sponsorName && (
          <p className="text-gray-600">
            {user.role === "driver"
              ? `Products from ${sponsorName}`
              : sponsorName}
          </p>
        )}
        {user.role === "admin" && (
          <p className="text-gray-600">
            Viewing all products across all sponsors
          </p>
        )}
      </div>

      {isViewingAsDriver && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg mb-8 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-sm mb-1">Your Point Balance</p>
              <p className="text-4xl font-bold">
                {currentBalance.toLocaleString()} points
              </p>
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

      {user.role === "driver" && !sponsorName ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            You are not affiliated with a sponsor yet.
          </p>
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
          <div className="mb-4">
            <p className="text-gray-600">
              Showing {products.length} product
              {products.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const productPointValue =
                product.sponsor?.pointValue || pointValue;
              const pointPrice = convertToPoints(
                product.price,
                productPointValue,
              );
              const canAfford = isViewingAsDriver
                ? currentBalance >= pointPrice
                : true;
              const showNewBadge = isNewProduct(product.createdAt);

              return (
                <div
                  key={product.id}
                  className="bg-white border rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <Link
                    href={`/driver/catalog/${product.id}`}
                    className="block"
                  >
                    <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                      {showNewBadge && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                          NEW
                        </div>
                      )}

                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <svg
                            className="w-16 h-16 mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm">No image</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    {user.role === "admin" && product.sponsor && (
                      <p className="text-xs text-blue-600 font-semibold mb-2">
                        {product.sponsor.name}
                      </p>
                    )}

                    <Link href={`/driver/catalog/${product.id}`} className="block">
                      <h3 className="font-semibold text-base mb-3 line-clamp-2 h-12 hover:text-blue-600 transition">
                        {product.title}
                      </h3>
                    </Link>

                    <div className="mb-4">
                      <p className="text-2xl font-bold text-green-600">
                        {pointPrice.toLocaleString()} points
                      </p>
                      {isViewingAsDriver && !canAfford && (
                        <p className="text-xs text-red-600 mt-1">
                          Need {(pointPrice - currentBalance).toLocaleString()}{" "}
                          more points
                        </p>
                      )}
                    </div>

                    {isViewingAsDriver ? (
                      <AddToCartButton
                        catalogProductId={product.id}
                        canAfford={canAfford}
                      />
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
    </div>
  );
}