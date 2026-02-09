"use client";

import { useMemo, useState } from "react";

type PointTransaction = {
  id: string;
  amount: number;
  reason: string;
  sponsorName: string;
  createdAt: string;
};

interface PointsHistoryClientProps {
  pointsBalance: number;
  transactions: PointTransaction[];
}

export default function PointsHistoryClient({
  pointsBalance,
  transactions,
}: PointsHistoryClientProps) {
  const [typeFilter, setTypeFilter] = useState<"all" | "additions" | "deductions">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter === "additions" && tx.amount < 0) return false;
      if (typeFilter === "deductions" && tx.amount > 0) return false;

      const txDate = new Date(tx.createdAt);
      if (fromDate) {
        const from = new Date(fromDate);
        if (txDate < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (txDate > to) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, fromDate, toDate]);

  return (
    <div className="pt-16">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
          <div className="text-sm uppercase tracking-wide text-blue-600 font-semibold">
            Points Balance
          </div>
          <div className="mt-2 text-5xl font-extrabold text-blue-900">
            {pointsBalance}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Type</label>
              <select
                className="border rounded px-3 py-2"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "all" | "additions" | "deductions")}
              >
                <option value="all">All</option>
                <option value="additions">Additions</option>
                <option value="deductions">Deductions</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">From</label>
              <input
                type="date"
                className="border rounded px-3 py-2"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">To</label>
              <input
                type="date"
                className="border rounded px-3 py-2"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Point Transactions</h2>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-6 text-gray-600">No transactions match the filters.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="text-sm text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-gray-900 font-medium">{tx.reason}</div>
                    <div className="text-sm text-gray-600">Sponsor: {tx.sponsorName}</div>
                  </div>
                  <div className={tx.amount >= 0 ? "text-green-600 text-lg font-semibold" : "text-red-600 text-lg font-semibold"}>
                    {tx.amount >= 0 ? "+" : ""}{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
