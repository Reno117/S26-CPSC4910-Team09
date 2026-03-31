import { prisma } from "@/lib/prisma";
import AdminHeader from "../../components/AdminComponents/AdminHeader";
import OrderCard from "@/app/components/orders/OrderCard";

type AdminAllOrdersPageProps = {
  searchParams: Promise<{
    user?: string | string[];
  }>;
};

export default async function AdminAllOrdersPage({ searchParams }: AdminAllOrdersPageProps) {
  const { user: userSearchParam } = await searchParams;
  const userSearch = (Array.isArray(userSearchParam) ? userSearchParam[0] : userSearchParam ?? "").trim();

  const orders = await prisma.order.findMany({
    where: userSearch
      ? {
          driverProfile: {
            user: {
              OR: [
                {
                  name: {
                    contains: userSearch,
                  },
                },
                {
                  email: {
                    contains: userSearch,
                  },
                },
              ],
            },
          },
        }
      : undefined,
    include: {
      driverProfile: {
        include: {
          user: true,
        },
      },
      sponsor: true,
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const pending = orders.filter((order) => order.status === "pending").length;
  const processing = orders.filter((order) => order.status === "processing").length;
  const shipped = orders.filter((order) => order.status === "shipped").length;
  const delivered = orders.filter((order) => order.status === "delivered").length;
  const cancelled = orders.filter((order) => order.status === "cancelled").length;

  return (
    <div>
      <AdminHeader />

      <div className="container mx-auto p-4 pt-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">All Orders</h1>
          <p className="text-gray-600">Manage and update order statuses</p>
        </div>

        <form method="GET" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            name="user"
            defaultValue={userSearch}
            placeholder="Search by user name or email"
            className="w-full sm:max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
            {userSearch && (
              <a
                href="/admin/all-orders"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </a>
            )}
          </div>
        </form>

        {userSearch && (
          <p className="mb-4 text-sm text-gray-600">
            Showing results for user: <span className="font-medium text-gray-900">{userSearch}</span>
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <div className="bg-white p-3 rounded-lg border text-center">
            <p className="text-xs text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pending}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border text-center">
            <p className="text-xs text-gray-600 mb-1">Processing</p>
            <p className="text-2xl font-bold text-blue-600">{processing}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border text-center">
            <p className="text-xs text-gray-600 mb-1">Shipped</p>
            <p className="text-2xl font-bold text-purple-600">{shipped}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border text-center">
            <p className="text-xs text-gray-600 mb-1">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{delivered}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border text-center">
            <p className="text-xs text-gray-600 mb-1">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{cancelled}</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              {userSearch ? "No orders match that user search" : "No orders yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} isAdmin={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
