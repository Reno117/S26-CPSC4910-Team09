import Link from "next/link";
import {
  getPointChangeAuditReport,
  exportPointChangeAuditCSV,
  type PointChangeEntry,
  type PointChangeDriverSummary,
  type PointChangeSponsorSummary,
  type PointChangeDayBucket,
} from "@/app/actions/admin/point-change-audit-actions";
import { ExportCSVButton } from "@/app/components/AdminComponents/ExportCSVButton";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; sponsor?: string; view?: string }>;
  sponsorId: string;
}

type ViewMode = "summary" | "detailed";

function getViewMode(view?: string): ViewMode {
  return view === "detailed" ? "detailed" : "summary";
}

function buildViewHref({
  from,
  to,
  sponsor,
  view,
}: {
  from: string;
  to: string;
  sponsor: string;
  view: ViewMode;
}) {
  const params = new URLSearchParams({ from, to, sponsor, view });
  return `/sponsor/reports/point-change-report?${params.toString()}`;
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
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
 
function fmtPoints(n: number) {
  return n.toLocaleString();
}
 
// ─── Metric Card ──────────────────────────────────────────────────────────────
 
function MetricCard({
  label, value, sub, accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "red" | "amber" | "emerald" | "sky";
}) {
  const colors = {
    red: "text-red-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    sky: "text-sky-600",
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
 
// ─── Amount Badge ─────────────────────────────────────────────────────────────
 
function AmountBadge({ amount }: { amount: number }) {
  const isAdd = amount > 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border tabular-nums ${
      isAdd
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-red-50 text-red-700 border-red-200"
    }`}>
      {isAdd ? "+" : "−"}{fmtPoints(Math.abs(amount))}
    </span>
  );
}
 
// ─── Trend Chart ──────────────────────────────────────────────────────────────
 
function TrendChart({ data }: { data: PointChangeDayBucket[] }) {
  const maxVal = Math.max(...data.map((d) => d.added + d.deducted), 1);
  const labelEvery = Math.ceil(data.length / 7);
 
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">Daily point activity</p>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
            Added
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />
            Deducted
          </span>
        </div>
      </div>
      <div className="flex items-end gap-px" style={{ height: 120 }}>
        {data.map((d) => {
          const total = d.added + d.deducted;
          const totalPct = total / maxVal;
          const addedPct = total > 0 ? d.added / total : 0;
          const barH = Math.max(totalPct * 100, total > 0 ? 2 : 0);
          return (
            <div key={d.date} className="flex-1 flex flex-col justify-end group relative" style={{ height: "100%" }}>
              {total > 0 && (
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex flex-col items-center pointer-events-none">
                  <div className="bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                    <p className="font-medium mb-0.5">{d.date}</p>
                    <p className="text-emerald-300">+{fmtPoints(d.added)} added</p>
                    <p className="text-red-300">−{fmtPoints(d.deducted)} deducted</p>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-1" />
                </div>
              )}
              <div className="w-full rounded-sm overflow-hidden flex flex-col-reverse" style={{ height: `${barH}%` }}>
                <div className="w-full bg-emerald-400" style={{ height: `${addedPct * 100}%` }} />
                <div className="w-full bg-red-400" style={{ height: `${(1 - addedPct) * 100}%` }} />
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
 
// ─── Driver Summary Table ─────────────────────────────────────────────────────
 
function DriverSummaryTable({ drivers }: { drivers: PointChangeDriverSummary[] }) {
  const PREVIEW = 5;
  const shown = drivers.slice(0, PREVIEW);
  const hasMore = drivers.length > PREVIEW;
 
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Top drivers by point activity</p>
        <p className="text-xs text-slate-400">{drivers.length} drivers</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-2.5">Driver</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5">Sponsor</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-24">Changes</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-28">Added</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-28">Deducted</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-28">Net</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-28">Largest</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((d) => (
            <tr key={d.driverId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-3">
                <p className="text-slate-800 font-medium">{d.driverName ?? "Unknown"}</p>
                <p className="text-slate-400 text-xs font-mono">{d.driverEmail ?? "—"}</p>
              </td>
              <td className="px-4 py-3 text-slate-600 text-sm">{d.sponsorName}</td>
              <td className="px-4 py-3 text-slate-700 tabular-nums">{d.changeCount}</td>
              <td className="px-4 py-3 text-emerald-600 tabular-nums font-medium">+{fmtPoints(d.totalAdded)}</td>
              <td className="px-4 py-3 text-red-500 tabular-nums font-medium">−{fmtPoints(d.totalDeducted)}</td>
              <td className="px-4 py-3 tabular-nums font-semibold">
                <span className={d.netChange >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {d.netChange >= 0 ? "+" : "−"}{fmtPoints(Math.abs(d.netChange))}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600 tabular-nums">{fmtPoints(d.largestSingle)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <div className="px-5 py-2.5 border-t border-slate-100 text-xs text-slate-400">
          Showing top {PREVIEW} of {drivers.length} drivers
        </div>
      )}
    </div>
  );
}
 
// ─── Sponsor Summary Table ────────────────────────────────────────────────────
 
function SponsorSummaryTable({ sponsors }: { sponsors: PointChangeSponsorSummary[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Per-sponsor totals</p>
        <p className="text-xs text-slate-400">{sponsors.length} sponsors</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-2.5">Sponsor</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-24">Changes</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-24">Drivers</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-28">Added</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-28">Deducted</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-28">Net</th>
          </tr>
        </thead>
        <tbody>
          {sponsors.map((s) => (
            <tr key={s.sponsorId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-3 text-slate-800 font-medium">{s.sponsorName}</td>
              <td className="px-4 py-3 text-slate-700 tabular-nums">{s.changeCount}</td>
              <td className="px-4 py-3 text-slate-600 tabular-nums">{s.driversAffected}</td>
              <td className="px-4 py-3 text-emerald-600 tabular-nums font-medium">+{fmtPoints(s.totalAdded)}</td>
              <td className="px-4 py-3 text-red-500 tabular-nums font-medium">−{fmtPoints(s.totalDeducted)}</td>
              <td className="px-4 py-3 tabular-nums font-semibold">
                <span className={s.netChange >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {s.netChange >= 0 ? "+" : "−"}{fmtPoints(Math.abs(s.netChange))}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
 
// ─── Log Table ────────────────────────────────────────────────────────────────
 
function LogTable({ entries }: { entries: PointChangeEntry[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-700">
          Point change log
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
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-36">Sponsor</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-28">Amount</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Reason</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-44">Changed by</th>
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
                  <td className="px-4 py-3 align-top text-slate-600 text-sm">{entry.sponsorName}</td>
                  <td className="px-4 py-3 align-top">
                    <AmountBadge amount={entry.amount} />
                  </td>
                  <td className="px-4 py-3 align-top text-slate-600 text-sm max-w-xs">
                    <p className="line-clamp-2">{entry.reason}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-slate-600 text-sm">{entry.changedByName ?? "—"}</p>
                    <p className="text-slate-400 text-xs font-mono">{entry.changedByEmail ?? ""}</p>
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
 
export default async function PointChangeReportPage({ searchParams, sponsorId }: PageProps) {
  const { from, to, view, sponsor: sponsorParam } = await searchParams;
  const sponsor = sponsorId || sponsorParam || "";
  const viewMode = getViewMode(view);
 
  if (!from || !to || from > to) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-sm text-center space-y-4">
          <p className="text-sm font-medium text-slate-700">Invalid report parameters</p>
          <p className="text-xs text-slate-400">Please go back and select a valid date range.</p>
          <Link
            href="/sponsor/reports/point-change-report"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ← Back to filters
          </Link>
        </div>
      </div>
    );
  }
 
  const result = await getPointChangeAuditReport({ dateFrom: from, dateTo: to, sponsor });
 
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
 
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/sponsor/reports"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to filters
            </Link>
            <span className="text-slate-200">|</span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Point Change Report</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {from} → {to} · {sponsor} · {viewMode === "summary" ? "Summary" : "Detailed"} view
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <Link
                href={buildViewHref({ from, to, sponsor, view: "summary" })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "summary"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Summary
              </Link>
              <Link
                href={buildViewHref({ from, to, sponsor, view: "detailed" })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "detailed"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Detailed
              </Link>
            </div>
            <ExportCSVButton
              filename={`point-change-audit-${viewMode}-${from}-to-${to}.csv`}
              fetchCSV={async () => {
                "use server";
                return exportPointChangeAuditCSV({ dateFrom: from, dateTo: to, sponsor });
              }}
            />
          </div>
        </div>
      </div>
 
      <div className="max-w-screen-xl mx-auto px-8 py-6 space-y-5">
 
        {/* ── Metric cards ── */}
        {viewMode === "summary" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Total changes" value={result.metrics.total.toLocaleString()} />
            <MetricCard label="Points added" value={`+${fmtPoints(result.metrics.totalAdded)}`} accent="emerald" />
            <MetricCard label="Points deducted" value={`−${fmtPoints(result.metrics.totalDeducted)}`} accent="red" />
            <MetricCard
              label="Net change"
              value={`${result.metrics.netChange >= 0 ? "+" : "−"}${fmtPoints(Math.abs(result.metrics.netChange))}`}
              accent={result.metrics.netChange >= 0 ? "emerald" : "red"}
            />
            <MetricCard label="Sponsors" value={result.metrics.uniqueSponsors.toString()} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <MetricCard label="Total changes" value={result.metrics.total.toLocaleString()} />
            <MetricCard label="Points added" value={`+${fmtPoints(result.metrics.totalAdded)}`} accent="emerald" />
            <MetricCard label="Points deducted" value={`−${fmtPoints(result.metrics.totalDeducted)}`} accent="red" />
            <MetricCard
              label="Net change"
              value={`${result.metrics.netChange >= 0 ? "+" : "−"}${fmtPoints(Math.abs(result.metrics.netChange))}`}
              accent={result.metrics.netChange >= 0 ? "emerald" : "red"}
            />
            <MetricCard label="Drivers" value={result.metrics.uniqueDrivers.toString()} />
            <MetricCard label="Sponsors" value={result.metrics.uniqueSponsors.toString()} />
            <MetricCard
              label="Largest change"
              value={fmtPoints(result.metrics.largestSingleChange)}
              sub="Single transaction"
              accent="amber"
            />
          </div>
        )}
 
        {/* ── Trend chart ── */}
        {result.dailyTrend.length > 1 && <TrendChart data={result.dailyTrend} />}
 
        {/* ── Two-column summaries ── */}
        {viewMode === "summary" ? (
          <div>
            {result.sponsorSummaries.length > 0 && (
              <SponsorSummaryTable sponsors={result.sponsorSummaries} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {result.driverSummaries.length > 0 && (
              <DriverSummaryTable drivers={result.driverSummaries} />
            )}
            {result.sponsorSummaries.length > 0 && (
              <SponsorSummaryTable sponsors={result.sponsorSummaries} />
            )}
          </div>
        )}
 
        {/* ── Log table ── */}
        {viewMode === "detailed" && <LogTable entries={result.entries} />}
 
      </div>
    </div>
  );
}