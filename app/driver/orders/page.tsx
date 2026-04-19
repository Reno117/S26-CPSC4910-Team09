import { requireDriver } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CancelOrderButton from "@/app/components/orders/cancel-order-button";
import DriverHeader from "@/app/components/DriverComponents/DriverHeader";

export default async function OrdersPage() {
  const user = await requireDriver();
  const driverProfile = user.driverProfile!;

  const orders = await prisma.order.findMany({
    where: { driverProfileId: driverProfile.id },
    include: { items: true, sponsor: true },
    orderBy: { createdAt: "desc" },
  });

  const statusColors = {
    pending:    "bg-yellow-100 text-yellow-800 border-yellow-300",
    processing: "bg-blue-100 text-blue-800 border-blue-300",
    shipped:    "bg-purple-100 text-purple-800 border-purple-300",
    delivered:  "bg-green-100 text-green-800 border-green-300",
    cancelled:  "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <DriverHeader />

      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              Order History
            </h1>
            <p className="text-sm text-black/70">View and manage your orders.</p>
          </div>
          <Link
            href="/driver/catalog"
            className="bg-[#0d2b45] text-white px-5 py-2.5 rounded-lg hover:opacity-80 transition text-sm font-medium"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">Total Orders</p>
            <p className="text-2xl font-semibold text-[#0d2b45]">{orders.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">Pending</p>
            <p className="text-2xl font-semibold text-amber-500">
              {orders.filter((o) => o.status === "pending").length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">In Progress</p>
            <p className="text-2xl font-semibold text-blue-600">
              {orders.filter((o) => ["processing", "shipped"].includes(o.status)).length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-black/10 p-4 shadow-sm">
            <p className="text-xs text-black/50 uppercase tracking-wide mb-1">Delivered</p>
            <p className="text-2xl font-semibold text-emerald-600">
              {orders.filter((o) => o.status === "delivered").length}
            </p>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-black/10 shadow-sm">
            <svg className="w-16 h-16 mx-auto text-black/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-sm text-black/50 mb-4">Start shopping to place your first order.</p>
            <Link
              href="/driver/catalog"
              className="inline-block bg-[#0d2b45] text-white px-6 py-2 rounded-lg hover:opacity-80 transition text-sm"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusColor = statusColors[order.status as keyof typeof statusColors] || statusColors.pending;
              const canCancel = order.status === "pending" || order.status === "processing";

              return (
                <div key={order.id} className="bg-white rounded-xl border border-black/10 p-6 hover:shadow-md transition shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          Order #{order.id.slice(-8)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusColor}`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-black/50">
                        Placed {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-black/50">Sponsor: {order.sponsor.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-black/40 mb-1">Total</p>
                      <p className="text-2xl font-semibold text-emerald-600">
                        {order.totalPoints.toLocaleString()} pts
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 pb-4 border-b border-black/10">
                    <p className="text-sm font-medium text-black/60 mb-2">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex gap-2 overflow-x-auto">
                      {order.items.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex-shrink-0">
                          <div className="w-16 h-16 bg-black/5 rounded-lg flex items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.title} className="max-w-full max-h-full object-contain" />
                            ) : (
                              <span className="text-black/30 text-xs">No img</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {order.items.length > 5 && (
                        <div className="w-16 h-16 bg-black/5 rounded-lg flex items-center justify-center text-black/40 text-xs">
                          +{order.items.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/driver/orders/${order.id}`}
                      className="flex-1 bg-[#0d2b45] text-white py-2 px-4 rounded-lg text-center font-medium hover:opacity-80 transition text-sm"
                    >
                      View Details
                    </Link>
                    <CancelOrderButton orderId={order.id} canCancel={canCancel} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}