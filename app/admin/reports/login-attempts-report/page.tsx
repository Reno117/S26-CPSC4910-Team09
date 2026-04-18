import Link from "next/link";
import { getSignInAuditReport, exportSignInAuditCSV, type SignInEntry, type SignInUserSummary, type SignInDayBucket } from "@/app/actions/admin/signin-audit-actions";
import { ExportCSVButton } from "@/app/components/AdminComponents/ExportCSVButton";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; sponsor?: string }>;
}
 
// ─── Constants ────────────────────────────────────────────────────────────────
 
const STREAK_THRESHOLD = 3;
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
function formatTimestamp(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}
 
function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
 
// ─── Metric Card ──────────────────────────────────────────────────────────────
 
function MetricCard({
  label, value, sub, accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "red" | "amber" | "emerald";
}) {
  const colors = {
    red: "text-red-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${accent ? colors[accent] : "text-slate-900"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
 
// ─── Suspicious Alert ─────────────────────────────────────────────────────────
 
function SuspiciousAlert({ users }: { users: SignInUserSummary[] }) {
  if (users.length === 0) return null;
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl">
      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <div>
        <p className="text-sm font-semibold text-red-800">
          {users.length} {users.length === 1 ? "account" : "accounts"} with suspicious activity
        </p>
        <p className="text-xs text-red-600 mt-0.5">
          The following {users.length === 1 ? "user has" : "users have"} {STREAK_THRESHOLD}+ consecutive failed sign-in attempts:{" "}
          {users.map((u) => u.userEmail ?? u.userName ?? "Unknown").join(", ")}.
        </p>
      </div>
    </div>
  );
}
 
// ─── Trend Chart ──────────────────────────────────────────────────────────────
 
function TrendChart({ data }: { data: SignInDayBucket[] }) {
  const maxVal = Math.max(...data.map((d) => d.successes + d.failures), 1);
  const labelEvery = Math.ceil(data.length / 7);
 
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">Daily sign-in trend</p>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
            Success
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />
            Failed
          </span>
        </div>
      </div>
      <div className="flex items-end gap-px" style={{ height: 120 }}>
        {data.map((d) => {
          const total = d.successes + d.failures;
          const totalPct = total / maxVal;
          const successPct = total > 0 ? d.successes / total : 0;
          const barH = Math.max(totalPct * 100, total > 0 ? 2 : 0);
          return (
            <div key={d.date} className="flex-1 flex flex-col justify-end group relative" style={{ height: "100%" }}>
              {total > 0 && (
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex flex-col items-center pointer-events-none">
                  <div className="bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                    <p className="font-medium mb-0.5">{d.date}</p>
                    <p className="text-emerald-300">{d.successes} success</p>
                    <p className="text-red-300">{d.failures} failed</p>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-1" />
                </div>
              )}
              <div className="w-full rounded-sm overflow-hidden flex flex-col-reverse" style={{ height: `${barH}%` }}>
                <div className="w-full bg-emerald-400" style={{ height: `${successPct * 100}%` }} />
                <div className="w-full bg-red-400" style={{ height: `${(1 - successPct) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-px mt-1.5">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % labelEvery === 0 && (
              <span className="text-[10px] text-slate-400 leading-none">{d.date}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
 
// ─── User Summary Table ───────────────────────────────────────────────────────
 
function UserSummaryTable({ users }: { users: SignInUserSummary[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Per-user breakdown</p>
        <p className="text-xs text-slate-400">{users.length} users</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-2.5">User</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-20">Total</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-20">Success</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-20">Failed</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-48">Success rate</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-36">Last attempt</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-28">Risk</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const key = u.userId ?? u.userEmail ?? "anon";
            return (
              <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-slate-800 font-medium text-sm">{u.userName ?? "Unknown"}</p>
                  <p className="text-slate-400 text-xs font-mono">{u.userEmail ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-slate-700 tabular-nums">{u.total}</td>
                <td className="px-4 py-3 text-emerald-600 tabular-nums font-medium">{u.successes}</td>
                <td className="px-4 py-3 text-red-500 tabular-nums font-medium">{u.failures}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${u.successRate}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{u.successRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDateShort(u.lastAttempt)}</td>
                <td className="px-4 py-3">
                  {u.suspiciousStreak ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {u.streakLength} failures
                    </span>
                  ) : u.failures > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Monitor
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Normal
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
 
// ─── Log Table ────────────────────────────────────────────────────────────────
 
function LogTable({ entries }: { entries: SignInEntry[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-700">
          Sign-in log
          <span className="ml-2 text-xs font-normal text-slate-400">{entries.length} entries</span>
        </p>
        <p className="text-xs text-slate-400">Newest first</p>
      </div>
      {entries.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-500">No entries found for this date range</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 w-44">Timestamp</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">User</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-28">Result</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const { date, time } = formatTimestamp(entry.timestamp);
              return (
                <tr key={entry.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 align-top">
                    <p className="text-slate-800 font-medium tabular-nums">{date}</p>
                    <p className="text-slate-400 text-xs tabular-nums">{time}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-slate-800 font-medium">{entry.userName ?? "Unknown"}</p>
                    <p className="text-slate-400 text-xs font-mono">{entry.userEmail ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {entry.success ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
 
// ─── Page (Server Component) ──────────────────────────────────────────────────
 
export default async function LoginAttemptsReportPage({ searchParams }: PageProps) {
  const { from, to, sponsor = "All Sponsors" } = await searchParams;
 
  // Guard: redirect back if params are missing or invalid
  if (!from || !to || from > to) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-sm text-center space-y-4">
          <p className="text-sm font-medium text-slate-700">Invalid report parameters</p>
          <p className="text-xs text-slate-400">Please go back and select a valid date range.</p>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ← Back to filters
          </Link>
        </div>
      </div>
    );
  }
 
  const result = await getSignInAuditReport({ dateFrom: from, dateTo: to, sponsor });
  const suspiciousUsers = result.userSummaries.filter((u) => u.suspiciousStreak);
 
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
 
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/reports"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to filters
            </Link>
            <span className="text-slate-200">|</span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Sign-in Attempts Report</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {from} → {to} · {sponsor}
              </p>
            </div>
          </div>
 
          {/* CSV export — client component so it can use Blob download */}
          <ExportCSVButton
            filename={`signin-audit-${from}-to-${to}.csv`}
            fetchCSV={async () => {
              "use server";
              return exportSignInAuditCSV({ dateFrom: from, dateTo: to, sponsor });
            }}
          />
        </div>
      </div>
 
      <div className="max-w-screen-xl mx-auto px-8 py-6 space-y-5">
 
        {/* Suspicious alert */}
        <SuspiciousAlert users={suspiciousUsers} />
 
        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="Total attempts" value={result.metrics.total.toLocaleString()} />
          <MetricCard label="Successful"     value={result.metrics.successes.toLocaleString()} accent="emerald" />
          <MetricCard label="Failed"         value={result.metrics.failures.toLocaleString()} accent={result.metrics.failures > 0 ? "red" : undefined} />
          <MetricCard label="Success rate"   value={`${result.metrics.successRate}%`} accent={result.metrics.successRate < 80 ? "amber" : "emerald"} />
          <MetricCard label="Unique users"   value={result.metrics.uniqueUsers.toString()} />
          <MetricCard
            label="Suspicious"
            value={result.metrics.suspiciousUsers.toString()}
            sub={result.metrics.suspiciousUsers > 0 ? "Review required" : "None flagged"}
            accent={result.metrics.suspiciousUsers > 0 ? "red" : undefined}
          />
        </div>
 
        {/* Trend chart */}
        {result.dailyTrend.length > 1 && <TrendChart data={result.dailyTrend} />}
 
        {/* Per-user breakdown */}
        {result.userSummaries.length > 0 && <UserSummaryTable users={result.userSummaries} />}
 
        {/* Log table */}
        <LogTable entries={result.entries} />
 
      </div>
    </div>
  );
}
 