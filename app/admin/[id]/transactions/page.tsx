import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminHeader from "../../../components/AdminComponents/AdminHeader";
import { createAdminPointTransaction } from "@/app/actions/admin/create-point-transaction";

interface AdminDriverTransactionsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function AdminDriverTransactionsPage({ params, searchParams }: AdminDriverTransactionsPageProps) {
  const { id } = await params;
  const { saved, error } = await searchParams;

  const driver = await prisma.driverProfile.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });

  if (!driver) {
    notFound();
  }

  const sponsorOptions = await prisma.$queryRaw<{
    sponsorId: string;
    sponsorName: string;
  }[]>`
    SELECT
      sb.sponsorOrgId AS sponsorId,
      s.name AS sponsorName
    FROM sponsored_by sb
    INNER JOIN sponsor s ON s.id = sb.sponsorOrgId
    WHERE sb.driverId = ${id}
    ORDER BY s.name ASC
  `;

  const transactions = await prisma.pointChange.findMany({
    where: { driverProfileId: id },
    include: {
      sponsor: true,
      changedByUser: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      <AdminHeader />

      <main className="pt-24 px-6 min-h-screen flex flex-col items-center">
        <section className="w-full max-w-5xl bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Point Transactions</h1>
              <p className="text-sm text-gray-600">{driver.user.name}</p>
            </div>
            <Link
              href={`/admin/${id}`}
              className="inline-flex rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
            >
              Back to Driver Profile
            </Link>
          </div>

          {saved === "1" && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Point transaction created successfully.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to create point transaction. Make sure sponsor is selected, amount is not 0, and reason is provided.
            </div>
          )}

          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Create Point Transaction</h2>
            <form action={createAdminPointTransaction} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <input type="hidden" name="driverId" value={id} />

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Sponsor Organization</label>
                <select
                  name="sponsorId"
                  required
                  defaultValue=""
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
                >
                  <option value="" disabled>Select sponsor</option>
                  {sponsorOptions.map((sponsor) => (
                    <option key={sponsor.sponsorId} value={sponsor.sponsorId}>
                      {sponsor.sponsorName}
                    </option>
                  ))}
                </select>
                {sponsorOptions.length === 0 && (
                  <p className="mt-1 text-xs text-red-600">This driver has no sponsor associations.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Amount (+/-)</label>
                <input
                  name="amount"
                  type="number"
                  required
                  placeholder="e.g. 100 or -50"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Reason</label>
                <input
                  name="reason"
                  required
                  placeholder="Reason for adjustment"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
                />
              </div>

              <button
                type="submit"
                disabled={sponsorOptions.length === 0}
                className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create Point Transaction
              </button>
            </form>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-gray-600">
              No point transactions found for this driver.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 pr-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="py-3 pr-4 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="py-3 pr-4 text-sm font-semibold text-gray-700">Reason</th>
                    <th className="py-3 pr-4 text-sm font-semibold text-gray-700">Changed By</th>
                    <th className="py-3 pr-4 text-sm font-semibold text-gray-700">Sponsor</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 text-sm text-gray-700">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                      <td className={`py-3 pr-4 text-sm font-semibold ${transaction.amount >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {transaction.amount >= 0 ? `+${transaction.amount}` : transaction.amount}
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-700">{transaction.reason}</td>
                      <td className="py-3 pr-4 text-sm text-gray-700">{transaction.changedByUser.name}</td>
                      <td className="py-3 pr-4 text-sm text-gray-700">{transaction.sponsor.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
