import { requireDriver } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DriverHeader from "@/app/components/DriverComponents/DriverHeader";
import CartItemCard from "@/app/components/cart/cart-item-card";
import CheckoutButton from "@/app/components/cart/checkout-button";

export default async function CartPage() {
  const user = await requireDriver();
  const driverProfile = user.driverProfile!;

  // Get cart with items
  const cart = await prisma.cart.findUnique({
    where: { driverProfileId: driverProfile.id },
    include: {
      items: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const cartItems = cart?.items || [];
  const totalPoints = cartItems.reduce(
    (sum, item) => sum + item.pointPrice * item.quantity,
    0,
  );
  const currentBalance = driverProfile.pointsBalance;
  const canCheckout = cartItems.length > 0 && currentBalance >= totalPoints;
  const pointsNeeded =
    totalPoints > currentBalance ? totalPoints - currentBalance : 0;

  return (
    <div>
      <DriverHeader />

      <div className="pt-20 p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <Link href="/driver/catalog" className="text-blue-600 hover:underline">
          ← Continue Shopping
        </Link>
      </div>

      {/* Balance Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg mb-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-blue-100 text-sm mb-1">Your Point Balance</p>
            <p className="text-3xl font-bold">
              {currentBalance.toLocaleString()} points
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm mb-1">Cart Total</p>
            <p className="text-3xl font-bold">
              {totalPoints.toLocaleString()} points
            </p>
          </div>
        </div>
        {pointsNeeded > 0 && (
          <div className="mt-4 bg-red-500 bg-opacity-30 border border-red-300 rounded px-4 py-2">
            <p className="text-sm">
              ⚠️ You need {pointsNeeded.toLocaleString()} more points to
              complete this purchase
            </p>
          </div>
        )}
      </div>

      {/* Empty Cart */}
      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-600 mb-4">Add some products to get started</p>
          <Link
            href="/driver/catalog"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <CartItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({cartItems.length})</span>
                  <span>{totalPoints.toLocaleString()} points</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-green-600">
                    {totalPoints.toLocaleString()} points
                  </span>
                </div>
              </div>

              <CheckoutButton
                canCheckout={canCheckout}
                totalPoints={totalPoints}
                pointsNeeded={pointsNeeded}
              />

              {pointsNeeded > 0 && (
                <p className="text-xs text-red-600 text-center mt-2">
                  Need {pointsNeeded.toLocaleString()} more points
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
