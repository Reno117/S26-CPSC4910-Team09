import Link from "next/link";
import { notFound } from "next/navigation";
import DriverHeader from "@/app/components/DriverComponents/DriverHeader";
import AddToCartButton from "@/app/components/catalog/add-to-cart-button";
import { getCurrentUser } from "@/lib/auth-helpers";
import { convertToPoints, getEbayItemDescription } from "@/lib/ebay-api";
import { prisma } from "@/lib/prisma";

interface ProductDetailPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const product = await prisma.catalogProduct.findUnique({
    where: { id: productId },
    include: {
      sponsor: true,
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  let currentBalance = 0;
  let isViewingAsDriver = false;

  if (user.role === "driver") {
    const driverProfile = user.driverProfile;
    if (!driverProfile) {
      throw new Error("Driver profile not found");
    }

    if (driverProfile.sponsorId !== product.sponsorId) {
      notFound();
    }

    currentBalance = driverProfile.pointsBalance;
    isViewingAsDriver = true;
  } else if (user.role === "sponsor") {
    const sponsorUser = user.sponsorUser;
    if (!sponsorUser || sponsorUser.sponsorId !== product.sponsorId) {
      notFound();
    }
  } else if (user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const pointPrice = convertToPoints(product.price, product.sponsor.pointValue || 0.01);
  const canAfford = isViewingAsDriver ? currentBalance >= pointPrice : true;
  const description = await getEbayItemDescription(product.ebayItemId);

  return (
    <div>
      <DriverHeader />

      <div className="pt-20 p-8 max-w-6xl mx-auto">
        <Link href="/driver/catalog" className="text-blue-600 hover:underline">
          ← Back to Catalog
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border rounded-lg p-6 flex items-center justify-center min-h-[24rem]">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="max-h-[22rem] max-w-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-sm">No image</div>
            )}
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-4">{product.title}</h1>

            <p className="text-3xl font-bold text-green-600 mb-2">
              {pointPrice.toLocaleString()} points
            </p>

            <p className="text-sm text-gray-500 mb-1">
              eBay Price: ${product.price.toFixed(2)}
            </p>

            <p className="text-sm text-gray-500 mb-6">
              eBay Item ID: {product.ebayItemId}
            </p>

            {isViewingAsDriver && !canAfford && (
              <p className="text-sm text-red-600 mb-3">
                Need {(pointPrice - currentBalance).toLocaleString()} more points
              </p>
            )}

            {isViewingAsDriver ? (
              <AddToCartButton catalogProductId={product.id} canAfford={true} />
            ) : (
              <button
                type="button"
                disabled
                className="w-full bg-gray-300 text-gray-600 font-medium py-2 px-4 rounded-lg cursor-not-allowed"
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">Product Description</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {description || "Description is not available for this item."}
          </p>
        </div>
      </div>
    </div>
  );
}
