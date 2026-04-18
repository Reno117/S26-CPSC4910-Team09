import { prisma } from "@/lib/prisma";
import AdminHeader from "../../components/AdminComponents/AdminHeader";
import OrderCard from "@/app/components/orders/OrderCard";
import Link from "next/link";

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
                { name: { contains: userSearch } },
                { email: { contains: userSearch } },
              ],
            },
          },
        }
      : undefined,
    include: {
      driverProfile: { include: { user: true } },
      sponsor: true,
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = orders.filter((o) => o.status === "pending").length;
  const processing = orders.filter((o) => o.status === "processing").length;
  const shipped = orders.filter((o) => o.status === "shipped").length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;

  const stats = [
    { label: "Pending",    count: pending,    color: "text-yellow-600" },
    { label: "Processing", count: processing, color: "text-blue-600"   },
    { label: "Shipped",    count: shipped,    color: "text-purple-600" },
    { label: "Delivered",  count: delivered,  color: "text-green-600"  },
    { label: "Cancelled",  count: cancelled,  color: "text-red-500"    },
  ];

  return (
        <div className="min-h-screen bg-[#e9eaeb] text-black">
          <div style={{ colorScheme: "only light" }} />
          <AdminHeader />

          <div className="mx-auto max-w-6xl px-6 py-16 pt-24">
            {/* Page heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-semibold leading-tight tracking-tight">
                All Orders
              </h1>
              <p className="mt-2 text-sm text-black/70">
                Manage and update order statuses
              </p>
            </div>

            {/* Search bar */}
          <form
      method="GET"
      className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <input
        type="text"
        name="user"
        defaultValue={userSearch}
        placeholder="Search by user name or email"
        className="w-full sm:max-w-md rounded-xl border border-black/10 bg-white px-4 py-2 text-sm shadow-sm placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-xl bg-black px-5 py-2 text-sm font-medium text-white hover:bg-black/80 transition-colors"
        >
          Search
        </button>
        {userSearch && (
          <Link
            href="/admin/all-orders"
            className="rounded-xl border border-black/10 bg-white px-5 py-2 text-sm font-medium text-black/70 hover:bg-black/5 transition-colors"
          >
            Clear
          </Link>
        )}
      </div>
    </form>

        {userSearch && (
          <p className="mb-6 text-sm text-black/60">
            Showing results for:{" "}
            <span className="font-medium text-black">{userSearch}</span>
          </p>
        )}

        {/* Stats */}
        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-5">
          {stats.map(({ label, count, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-black/10 bg-white p-4 text-center shadow-sm"
            >
              <p className="mb-1 text-xs text-black/50">{label}</p>
              <p className={`text-2xl font-semibold ${color}`}>{count}</p>
            </div>
          ))}
        </div>

        {/* Orders list */}
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white py-20 text-center shadow-sm">
            <p className="text-sm text-black/50">
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