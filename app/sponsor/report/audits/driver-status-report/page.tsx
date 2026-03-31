import Link from "next/link";
import {
  getDriverStatusReport,
  exportDriverStatusCSV,
  type DriverStatusEntry,
  type DriverStatusDriverSummary,
  type DriverStatusDayBucket,
} from "@/app/actions/admin/driver-status-actions";
import { ExportCSVButton } from "@/app/components/AdminComponents/ExportCSVButton";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; sponsor?: string }>;
}
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
function formatTimestamp(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}
 
function formatDateShort(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
 
function statusBadgeClasses(status: string): string {
  const s = status.toLowerCase();
  if (["active", "approved", "activated"].includes(s))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["inactive", "deactivated", "suspended"].includes(s))
    return "bg-slate-100 text-slate-600 border-slate-200";
  if (["banned", "rejected"].includes(s))
    return "bg-red-50 text-red-700 border-red-200";
  if (["pending", "under_review"].includes(s))
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-sky-50 text-sky-700 border-sky-200";
}
 
function changedByBadgeClasses(type: "sponsor" | "admin" | "system"): string {
  switch (type) {
    case "sponsor": return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "admin":   return "bg-violet-50 text-violet-700 border-violet-200";
    default:        return "bg-slate-50 text-slate-500 border-slate-200";
  }
}
 
function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
 
// ─── Metric Card ──────────────────────────────────────────────────────────────
 
function MetricCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "red" | "amber" | "emerald" | "violet" | "sky" | "indigo";
  icon?: React.ReactNode;
}) {
  const colors = {
    red: "text-red-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    sky: "text-sky-600",
    indigo: "text-indigo-600",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        {icon && <span className="text-slate-300">{icon}</span>}
      </div>
      <p className={`text-2xl font-semibold tabular-nums ${accent ? colors[accent] : "text-slate-900"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
 
// ─── Flagged Alert ────────────────────────────────────────────────────────────
 
function FlaggedAlert({ drivers }: { drivers: DriverStatusDriverSummary[] }) {
  if (drivers.length === 0) return null;
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
      <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <div>
        <p className="text-sm font-semibold text-amber-800">
          {drivers.length} {drivers.length === 1 ? "driver" : "drivers"} with suspicious status change activity
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          {drivers.map((d) => d.driverName ?? d.driverEmail ?? d.driverId).join(", ")} —{" "}
          {drivers.length === 1 ? "this driver has" : "these drivers have"} unusually frequent or contradictory status changes. Please review.
        </p>
      </div>
    </div>
  );
}
 
// ─── Trend Chart ──────────────────────────────────────────────────────────────
 
function TrendChart({ data }: { data: DriverStatusDayBucket[] }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const labelEvery = Math.ceil(data.length / 7);
 
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">Daily status change trend</p>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
          Changes per day
        </div>
      </div>
      <div className="flex items-end gap-px" style={{ height: 120 }}>
        {data.map((d) => {
          const barH = Math.max((d.count / maxVal) * 100, d.count > 0 ? 2 : 0);
          return (
            <div key={d.date} className="flex-1 flex flex-col justify-end group relative" style={{ height: "100%" }}>
              {d.count > 0 && (
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex flex-col items-center pointer-events-none">
                  <div className="bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                    <p className="font-medium mb-0.5">{d.date}</p>
                    <p className="text-indigo-300">{d.count} change{d.count !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-1" />
                </div>
              )}
              <div
                className="w-full rounded-sm bg-indigo-400 hover:bg-indigo-500 transition-colors"
                style={{ height: `${barH}%` }}
              />
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
 
// ─── Driver Summary Table ─────────────────────────────────────────────────────
 
function DriverSummaryTable({ drivers }: { drivers: DriverStatusDriverSummary[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Per-driver breakdown</p>
        <p className="text-xs text-slate-400">{drivers.length} drivers</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-2.5">Driver</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-36">Sponsor</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-20">Changes</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-32">Current Status</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-40">First → Last</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-24">Activations</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-24">Deactivations</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-36">Risk</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d) => (
            <tr key={d.driverId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-3">
                <p className="text-slate-800 font-medium text-sm">{d.driverName ?? "Unknown"}</p>
                <p className="text-slate-400 text-xs font-mono">{d.driverEmail ?? "—"}</p>
              </td>
              <td className="px-4 py-3 text-slate-600 text-sm">{d.sponsorName ?? "—"}</td>
              <td className="px-4 py-3 text-slate-700 tabular-nums font-medium">{d.totalChanges}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusBadgeClasses(d.currentStatus)}`}>
                  {formatStatus(d.currentStatus)}
                </span>
              </td>
              <td className="px-4 py-3">
                <p className="text-xs text-slate-500 tabular-nums">{formatDateShort(d.firstChange)}</p>
                {d.firstChange !== d.lastChange && (
                  <p className="text-xs text-slate-400 tabular-nums">→ {formatDateShort(d.lastChange)}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={`tabular-nums font-medium text-sm ${d.activations > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                  {d.activations}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`tabular-nums font-medium text-sm ${d.deactivations > 0 ? "text-red-500" : "text-slate-400"}`}>
                  {d.deactivations}
                </span>
              </td>
              <td className="px-4 py-3">
                {d.flaggedActivity ? (
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Flagged
                    </span>
                    {d.flagReason && (
                      <p className="text-[10px] text-amber-600 mt-0.5 leading-tight max-w-[160px]">{d.flagReason}</p>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Normal
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
 
// ─── Log Table ────────────────────────────────────────────────────────────────
 
function LogTable({ entries }: { entries: DriverStatusEntry[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-700">
          Driver status log
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
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Driver</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-32">Sponsor</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-48">Status Change</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-28">Changed By</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-44">Actor</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Reason</th>
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
                    <p className="text-slate-800 font-medium">{entry.driverName ?? "Unknown"}</p>
                    <p className="text-slate-400 text-xs font-mono">{entry.driverEmail ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-slate-600 text-sm">
                    {entry.sponsorName ?? "—"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {entry.previousStatus ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusBadgeClasses(entry.previousStatus)}`}>
                          {formatStatus(entry.previousStatus)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">New</span>
                      )}
                      <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusBadgeClasses(entry.newStatus)}`}>
                        {formatStatus(entry.newStatus)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${changedByBadgeClasses(entry.changedByType)}`}>
                      {entry.changedByType.charAt(0).toUpperCase() + entry.changedByType.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {entry.changedByName ? (
                      <>
                        <p className="text-slate-700 text-sm">{entry.changedByName}</p>
                        <p className="text-slate-400 text-xs font-mono">{entry.changedByEmail ?? "—"}</p>
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-slate-500 max-w-xs">
                    {entry.changeReason ?? <span className="text-slate-300">No reason provided</span>}
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
 
export default async function DriverStatusReportPage({ searchParams }: PageProps) {
  const { from, to, sponsor = "All Sponsors" } = await searchParams;
 
  if (!from || !to || from > to) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-sm text-center space-y-4">
          <p className="text-sm font-medium text-slate-700">Invalid report parameters</p>
          <p className="text-xs text-slate-400">Please go back and select a valid date range.</p>
          <Link
            href="/sponsor/report/audits"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ← Back to filters
          </Link>
        </div>
      </div>
    );
  }
 
  const result = await getDriverStatusReport({ dateFrom: from, dateTo: to, sponsor });
  const flaggedDrivers = result.driverSummaries.filter((d) => d.flaggedActivity);
 
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
 
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/sponsor/report/audits"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to filters
            </Link>
            <span className="text-slate-200">|</span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Driver Status Report</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {from} → {to} · {sponsor}
              </p>
            </div>
          </div>
 
          <ExportCSVButton
            filename={`driver-status-${from}-to-${to}.csv`}
            fetchCSV={async () => {
              "use server";
              return exportDriverStatusCSV({ dateFrom: from, dateTo: to, sponsor });
            }}
          />
        </div>
      </div>
 
      <div className="max-w-screen-xl mx-auto px-8 py-6 space-y-5">
 
        {/* Flagged alert */}
        <FlaggedAlert drivers={flaggedDrivers} />
 
        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <MetricCard
            label="Total changes"
            value={result.metrics.total.toLocaleString()}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            }
          />
          <MetricCard
            label="Unique drivers"
            value={result.metrics.uniqueDrivers.toString()}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            }
          />
          <MetricCard
            label="Activations"
            value={result.metrics.activations.toString()}
            accent="emerald"
          />
          <MetricCard
            label="Deactivations"
            value={result.metrics.deactivations.toString()}
            accent={result.metrics.deactivations > 0 ? "red" : undefined}
          />
          <MetricCard
            label="Sponsor initiated"
            value={result.metrics.sponsorInitiated.toString()}
            accent="indigo"
          />
          <MetricCard
            label="Admin initiated"
            value={result.metrics.adminInitiated.toString()}
            accent="violet"
          />
          <MetricCard
            label="Flagged drivers"
            value={result.metrics.flaggedDrivers.toString()}
            sub={result.metrics.flaggedDrivers > 0 ? "Review required" : "None flagged"}
            accent={result.metrics.flaggedDrivers > 0 ? "amber" : undefined}
          />
        </div>
 
        {/* Trend chart */}
        {result.dailyTrend.length > 1 && <TrendChart data={result.dailyTrend} />}
 
        {/* Per-driver breakdown */}
        {result.driverSummaries.length > 0 && <DriverSummaryTable drivers={result.driverSummaries} />}
 
        {/* Full log */}
        <LogTable entries={result.entries} />
 
      </div>
    </div>
  );
}