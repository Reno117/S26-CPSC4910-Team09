import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getAuditLog() {
  return await prisma.pointLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
        driver: true,
        sponsorUser: true,
        adminUser: true,
    }
  });
}

const changeTypeBadge = {
  ADD: (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      Sponsor/Admin Addition
    </span>
  ),
  DEDUCT: (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Sponsor/Admin Deduction
    </span>
  ),
  PURCHASE: (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
      Catalog Purchase
    </span>
  ),
};
 
export default async function AuditLogPage() {
  const changes = await getAuditLog();
 
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-8xl">
 
        <div className="mb-6">
          <div className="mb-4">
            <Link
              href="/admin/audit"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
            >
              ← Back to Audits
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Point Change Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500">Most recent {changes.length} changes</p>
        </div>
 
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Driver</th>
                <th className="px-4 py-3 font-medium text-slate-500">Type</th>
                <th className="px-4 py-3 font-medium text-slate-500">Amount</th>
                <th className="px-4 py-3 font-medium text-slate-500">Reason</th>
                <th className="px-4 py-3 font-medium text-slate-500">Sponsor</th>
                <th className="px-4 py-3 font-medium text-slate-500">Before</th>
                <th className="px-4 py-3 font-medium text-slate-500">After</th>
                <th className="px-4 py-3 font-medium text-slate-500">Changers Role</th>
                <th className="px-4 py-3 font-medium text-slate-500">Changed By</th>
                <th className="px-4 py-3 font-medium text-slate-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {changes.map((change) => (
                <tr key={change.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700">
                    {change.driverId ?? (
                      <span className="text-slate-400 italic">Not Found</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {changeTypeBadge[change.changeType]}
                  </td>

                  <td className="px-4 py-3">
                    {change.amountChange}
                  </td>
                
                  <td className="px-4 py-3">
                    {change.changeReason}
                  </td>
                  
                  <td className="px-4 py-3">
                    {change.sponsorId}
                  
                  </td>
                  
                  <td className="px-4 py-3">
                    {change.pointsBefore}
                  </td>

                  <td className="px-4 py-3">
                    {change.pointsAfter}
                  </td>

                  <td className="px-4 py-3">
                    {change.adminUser
                        ? <span className="text-purple-600 font-medium">Admin</span>
                        : change.sponsorUser
                        ? <span className="text-blue-600 font-medium">Sponsor</span>
                        : <span className="text-slate-400 italic">Driver Purchase</span>
                    }
                  </td>

                  <td className="px-4 py-3">
                    {change.adminUser
                        ? <span className="text-purple-600 font-medium">{change.adminUserId}</span>
                        : change.sponsorUser
                        ? <span className="text-blue-600 font-medium">{change.sponsorUserId}</span>
                        : <span className="text-slate-400 italic">{change.driverId}</span>
                    }
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {new Date(change.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </td>
                </tr>
              ))}
 
              {changes.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-slate-400">
                    No point change records yet.
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