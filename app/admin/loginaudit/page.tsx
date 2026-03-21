import { prisma } from "@/lib/prisma";
 
async function getAuditLog() {
  return await prisma.signInAttempt.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });
}
 
export default async function AuditLogPage() {
  const attempts = await getAuditLog();
 
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl">
 
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Sign-in Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500">Most recent {attempts.length} attempts</p>
        </div>
 
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Email</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700">
                    {attempt.user?.email ?? (
                      <span className="text-slate-400 italic">Not Found</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {attempt.success ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(attempt.createdAt).toLocaleString("en-US", {
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
 
              {attempts.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-slate-400">
                    No sign-in attempts recorded yet.
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