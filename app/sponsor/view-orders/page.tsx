import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";
import OrderCard from "@/app/components/orders/OrderCard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ViewOrders() {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();

  const orders = await prisma.order.findMany({
    where: isAdmin ? {} : { sponsorId: sponsorId! },
    include: {
      driverProfile: { include: { user: true } },
      sponsor: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const session = await auth.api.getSession({ headers: await headers() });
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { name: true, email: true, role: true, image: true },
  });

  const pending    = orders.filter((o) => o.status === "pending").length;
  const processing = orders.filter((o) => o.status === "processing").length;
  const shipped    = orders.filter((o) => o.status === "shipped").length;
  const delivered  = orders.filter((o) => o.status === "delivered").length;
  const cancelled  = orders.filter((o) => o.status === "cancelled").length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <SponsorHeader userSettings={user} />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {isAdmin ? "All Orders" : "Driver Orders"}
          </h1>
          <p className="text-sm text-black/70">Manage and update order statuses.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm text-center">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">Pending</p>
            <p className="text-2xl font-semibold text-amber-500">{pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm text-center">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">Processing</p>
            <p className="text-2xl font-semibold text-blue-600">{processing}</p>
          </div>
          <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm text-center">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">Shipped</p>
            <p className="text-2xl font-semibold text-purple-600">{shipped}</p>
          </div>
          <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm text-center">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">Delivered</p>
            <p className="text-2xl font-semibold text-emerald-600">{delivered}</p>
          </div>
          <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm text-center">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">Cancelled</p>
            <p className="text-2xl font-semibold text-red-500">{cancelled}</p>
          </div>
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-black/10 shadow-sm">
            <p className="text-sm text-black/50">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}