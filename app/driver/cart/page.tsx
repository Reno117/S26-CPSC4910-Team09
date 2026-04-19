import { requireDriver } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DriverHeader from "@/app/components/DriverComponents/DriverHeader";
import CartItemCard from "@/app/components/cart/cart-item-card";
import CheckoutButton from "@/app/components/cart/checkout-button";

export default async function CartPage() {
  const user = await requireDriver();
  const driverProfile = user.driverProfile!;

  const carts = await prisma.cart.findMany({
    where: { driverProfileId: driverProfile.id },
    include: {
      sponsor: true,
      items: { orderBy: { createdAt: "desc" } },
    },
  });

  const cartsWithBalance = await Promise.all(
    carts.map(async (cart) => {
      let balance = 0;
      if (cart.sponsorId) {
        const sponsorship = await prisma.sponsoredBy.findUnique({
          where: {
            driverId_sponsorOrgId: {
              driverId: driverProfile.id,
              sponsorOrgId: cart.sponsorId,
            },
          },
        });
        balance = sponsorship?.points ?? 0;
      }
      const totalPoints = cart.items.reduce(
        (sum, item) => sum + item.pointPrice * item.quantity, 0
      );
      return {
        ...cart,
        balance,
        totalPoints,
        canCheckout: cart.items.length > 0 && balance >= totalPoints,
        pointsNeeded: totalPoints > balance ? totalPoints - balance : 0,
      };
    })
  );

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <DriverHeader />

      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              Shopping Cart
            </h1>
            <p className="text-sm text-black/70">Review your items before checkout.</p>
          </div>
          <Link
            href="/driver/catalog"
            className="text-sm text-black/50 hover:text-black transition"
          >
            ← Continue Shopping
          </Link>
        </div>

        {cartsWithBalance.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-black/10 shadow-sm">
            <p className="text-sm text-black/50 mb-4">Your cart is empty.</p>
            <Link
              href="/driver/catalog"
              className="inline-block bg-[#0d2b45] text-white px-6 py-2 rounded-lg hover:opacity-80 transition text-sm"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {cartsWithBalance.map((cart) => (
              <div key={cart.id}>
                <h2 className="text-lg font-semibold mb-4">
                  {cart.sponsor?.name ?? "Unknown Sponsor"}
                </h2>

                {/* Balance Banner */}
                <div className="bg-[#0d2b45] text-white p-6 rounded-xl mb-6 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
                        Your {cart.sponsor?.name} Points
                      </p>
                      <p className="text-3xl font-semibold">
                        {cart.balance.toLocaleString()} pts
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
                        Cart Total
                      </p>
                      <p className="text-3xl font-semibold">
                        {cart.totalPoints.toLocaleString()} pts
                      </p>
                    </div>
                  </div>
                  {cart.pointsNeeded > 0 && (
                    <div className="mt-4 bg-red-500/20 border border-red-400/30 rounded-lg px-4 py-2">
                      <p className="text-sm text-red-200">
                        ⚠️ You need {cart.pointsNeeded.toLocaleString()} more points to complete this purchase.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Cart Items */}
                  <div className="lg:col-span-2 space-y-4">
                    {cart.items.map((item) => (
                      <CartItemCard key={item.id} item={item} />
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-black/10 shadow-sm p-6 sticky top-24">
                      <h2 className="text-base font-semibold mb-4">Order Summary</h2>
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-black/60">
                          <span>Items ({cart.items.length})</span>
                          <span>{cart.totalPoints.toLocaleString()} pts</span>
                        </div>
                        <div className="border-t border-black/10 pt-3 flex justify-between font-semibold">
                          <span>Total</span>
                          <span className="text-emerald-600">
                            {cart.totalPoints.toLocaleString()} pts
                          </span>
                        </div>
                      </div>
                      <CheckoutButton
                        canCheckout={cart.canCheckout}
                        totalPoints={cart.totalPoints}
                        pointsNeeded={cart.pointsNeeded}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}