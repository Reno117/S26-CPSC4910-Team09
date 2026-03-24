import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { JSX } from "react";

async function getDriverStatusLogs() {
  return await prisma.driverStatusLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      driver: {
        include: {
          user: true,
        },
      },
      sponsorUser: {
        include: {
          user: true,
        },
      },
      admin: {
        include: {
          user: true,
        },
      },
    },
  });
}

const statusBadge: Record<string, JSX.Element> = {
  "pending": (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 ring-1 ring-yellow-200">
      Pending
    </span>
  ),
  "active": (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
      Active
    </span>
  ),
  "dropped": (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
      Dropped
    </span>
  ),
  "disabled": (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
      Disabled
    </span>
  ),
};

export default async function DriverStatusAuditPage() {
  await requireAdmin();
  
  const logs = await getDriverStatusLogs();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-8xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Driver Status Change Log</h1>
          <p className="mt-1 text-sm text-slate-500">Most recent {logs.length} status changes</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Driver</th>
                <th className="px-4 py-3 font-medium text-slate-500">Previous Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">New Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Changed By</th>
                <th className="px-4 py-3 font-medium text-slate-500">Reason</th>
                <th className="px-4 py-3 font-medium text-slate-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700">
                    {log.driver.user.name}
                    <div className="text-xs text-slate-500">{log.driver.user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {log.previousStatus ? statusBadge[log.previousStatus] : (
                      <span className="text-slate-400 italic">Initial</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {statusBadge[log.newStatus]}
                  </td>
                  <td className="px-4 py-3">
                    {log.admin ? (
                      <div>
                        <span className="text-purple-600 font-medium">Admin</span>
                        <div className="text-xs text-slate-500">{log.admin.user.name}</div>
                      </div>
                    ) : log.sponsorUser ? (
                      <div>
                        <span className="text-blue-600 font-medium">Sponsor</span>
                        <div className="text-xs text-slate-500">{log.sponsorUser.user.name}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">System</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.changeReason || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No status change records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}