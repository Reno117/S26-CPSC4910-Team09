import { requireDriver } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CancelOrderButton from "@/app/components/orders/cancel-order-button";
import DriverHeader from "@/app/components/DriverComponents/DriverHeader";

export default async function OrdersPage() {
  const user = await requireDriver();
  const driverProfile = user.driverProfile!;

  const orders = await prisma.order.findMany({
    where: {
      driverProfileId: driverProfile.id,
    },
    include: {
      items: true,
      sponsor: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    processing: "bg-blue-100 text-blue-800 border-blue-300",
    shipped: "bg-purple-100 text-purple-800 border-purple-300",
    delivered: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div>
      <DriverHeader />

      <div className="pt-20 p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Order History</h1>
          <p className="text-gray-600">View and manage your orders</p>
        </div>
        <Link
          href="/driver/catalog"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Continue Shopping
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === "pending").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">
            {orders.filter(o => ["processing", "shipped"].includes(o.status)).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Delivered</p>
          <p className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === "delivered").length}
          </p>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-4">Start shopping to place your first order</p>
          <Link
            href="/driver/catalog"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
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
              <div key={order.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">
                        Order #{order.id.slice(-8)}
                      </h3>
                      <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusColor}`}>
                        {order.status.toUpperCase()}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Placed {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      Sponsor: {order.sponsor.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {order.totalPoints.toLocaleString()} pts
                    </p>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-2 overflow-x-auto">
                    {order.items.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs">No img</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {order.items.length > 5 && (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-600 text-xs">
                        +{order.items.length - 5} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Link
                    href={`/driver/orders/${order.id}`}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-blue-700 transition text-sm"
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
      </div>
    </div>
  );
}