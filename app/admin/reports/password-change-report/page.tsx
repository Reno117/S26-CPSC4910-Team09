import Link from "next/link";
import {
  getPasswordResetReport,
  exportPasswordResetCSV,
  type PasswordResetEntry,
  type PasswordResetEmailSummary,
  type PasswordResetDayBucket,
} from "@/app/actions/admin/password-report-actions";
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
 
function formatSource(source: string): string {
  return source
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
  accent?: "red" | "amber" | "emerald" | "violet" | "sky";
  icon?: React.ReactNode;
}) {
  const colors = {
    red: "text-red-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    sky: "text-sky-600",
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
 
function FlaggedAlert({ emails }: { emails: PasswordResetEmailSummary[] }) {
  if (emails.length === 0) return null;
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
      <svg
        className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <div>
        <p className="text-sm font-semibold text-amber-800">
          {emails.length} {emails.length === 1 ? "address" : "addresses"} with suspicious reset
          activity
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          {emails.map((u) => u.email).join(", ")} —{" "}
          {emails.length === 1 ? "this address has" : "these addresses have"} unusually high
          frequency or multiple IP origins. Please review.
        </p>
      </div>
    </div>
  );
}
 
// ─── Trend Chart ──────────────────────────────────────────────────────────────
 
function TrendChart({ data }: { data: PasswordResetDayBucket[] }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const labelEvery = Math.ceil(data.length / 7);
 
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">Daily password reset trend</p>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-violet-400 inline-block" />
          Attempts per day
        </div>
      </div>
      <div className="flex items-end gap-px" style={{ height: 120 }}>
        {data.map((d) => {
          const barH = Math.max((d.count / maxVal) * 100, d.count > 0 ? 2 : 0);
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col justify-end group relative"
              style={{ height: "100%" }}
            >
              {d.count > 0 && (
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex flex-col items-center pointer-events-none">
                  <div className="bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                    <p className="font-medium mb-0.5">{d.date}</p>
                    <p className="text-violet-300">
                      {d.count} attempt{d.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-1" />
                </div>
              )}
              <div
                className="w-full rounded-sm bg-violet-400 hover:bg-violet-500 transition-colors"
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
 
// ─── Source Breakdown ─────────────────────────────────────────────────────────
 
function SourceBreakdown({
  data,
  total,
}: {
  data: { source: string; count: number }[];
  total: number;
}) {
  if (data.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-sm font-semibold text-slate-700 mb-4">Attempts by source</p>
      <div className="space-y-3">
        {data.map((s) => {
          const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
          return (
            <div key={s.source} className="flex items-center gap-3">
              <p className="text-sm text-slate-700 w-56 truncate flex-shrink-0">
                {formatSource(s.source)}
              </p>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 w-20 justify-end">
                <span className="text-xs text-slate-500 tabular-nums">{s.count}</span>
                <span className="text-xs text-slate-400 tabular-nums">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
 
// ─── Top IPs Panel ────────────────────────────────────────────────────────────
 
function TopIpsPanel({ ips, total }: { ips: { ip: string; count: number }[]; total: number }) {
  if (ips.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-700">Top originating IPs</p>
        <p className="text-xs text-slate-400 mt-0.5">
          IP addresses with the most password reset attempts
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-2.5">
              IP Address
            </th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-24">
              Count
            </th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5">
              Share
            </th>
          </tr>
        </thead>
        <tbody>
          {ips.map((ip, idx) => {
            const pct = total > 0 ? Math.round((ip.count / total) * 100) : 0;
            return (
              <tr
                key={ip.ip}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
              >
                <td className="px-5 py-2.5 font-mono text-sm text-slate-700 flex items-center gap-2">
                  {idx === 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-600 border border-violet-200">
                      TOP
                    </span>
                  )}
                  {ip.ip}
                </td>
                <td className="px-4 py-2.5 text-slate-700 tabular-nums">{ip.count}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums">{pct}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
 
// ─── Email Summary Table ──────────────────────────────────────────────────────
 
function EmailSummaryTable({ emails }: { emails: PasswordResetEmailSummary[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Per-email breakdown</p>
        <p className="text-xs text-slate-400">{emails.length} addresses</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-2.5">
              Email
            </th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-24">
              Attempts
            </th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-16">
              IPs
            </th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-40">
              First → Last
            </th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5">
              Sources
            </th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-36">
              Risk
            </th>
          </tr>
        </thead>
        <tbody>
          {emails.map((u) => (
            <tr
              key={u.email}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
            >
              <td className="px-5 py-3 font-mono text-sm text-slate-700">{u.email}</td>
              <td className="px-4 py-3 text-slate-700 tabular-nums font-medium">{u.totalAttempts}</td>
              <td className="px-4 py-3">
                <span
                  className={`tabular-nums font-medium text-sm ${
                    u.uniqueIps > 2 ? "text-amber-600" : "text-slate-700"
                  }`}
                >
                  {u.uniqueIps}
                </span>
              </td>
              <td className="px-4 py-3">
                <p className="text-xs text-slate-500 tabular-nums">{formatDateShort(u.firstAttempt)}</p>
                {u.firstAttempt !== u.lastAttempt && (
                  <p className="text-xs text-slate-400 tabular-nums">
                    → {formatDateShort(u.lastAttempt)}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {u.sources.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border bg-slate-50 text-slate-600 border-slate-200"
                    >
                      {formatSource(s)}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                {u.flaggedActivity ? (
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Flagged
                    </span>
                    {u.flagReason && (
                      <p className="text-[10px] text-amber-600 mt-0.5 leading-tight max-w-[160px]">
                        {u.flagReason}
                      </p>
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
 
function LogTable({ entries }: { entries: PasswordResetEntry[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-700">
          Password reset log
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
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 w-44">
                Timestamp
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                Email
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-36">
                IP Address
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-44">
                Source
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                User Agent
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const { date, time } = formatTimestamp(entry.timestamp);
              return (
                <tr
                  key={entry.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-5 py-3 align-top">
                    <p className="text-slate-800 font-medium tabular-nums">{date}</p>
                    <p className="text-slate-400 text-xs tabular-nums">{time}</p>
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-sm text-slate-700">
                    {entry.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 align-top font-mono text-xs text-slate-500">
                    {entry.ipAddress ?? "—"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">
                      {formatSource(entry.source)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-slate-400 max-w-xs truncate">
                    {entry.userAgent ?? "—"}
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
 
export default async function PasswordResetReportPage({ searchParams }: PageProps) {
  const { from, to, sponsor = "All Sponsors" } = await searchParams;
 
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
 
  const result = await getPasswordResetReport({ dateFrom: from, dateTo: to });
  const flaggedEmails = result.emailSummaries.filter((u) => u.flaggedActivity);
 
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
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back to filters
            </Link>
            <span className="text-slate-200">|</span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Password Reset Report</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {from} → {to} · {sponsor}
              </p>
            </div>
          </div>
 
          <ExportCSVButton
            filename={`password-resets-${from}-to-${to}.csv`}
            fetchCSV={async () => {
              "use server";
              return exportPasswordResetCSV({ dateFrom: from, dateTo: to });
            }}
          />
        </div>
      </div>
 
      <div className="max-w-screen-xl mx-auto px-8 py-6 space-y-5">
 
        {/* Flagged alert */}
        <FlaggedAlert emails={flaggedEmails} />
 
        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard
            label="Total attempts"
            value={result.metrics.total.toLocaleString()}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            }
          />
          <MetricCard
            label="Unique emails"
            value={result.metrics.uniqueEmails.toString()}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            }
          />
          <MetricCard
            label="Avg / email"
            value={result.metrics.avgAttemptsPerEmail.toString()}
            sub="attempts per address"
            accent={result.metrics.avgAttemptsPerEmail > 2 ? "amber" : undefined}
          />
          <MetricCard
            label="Unique IPs"
            value={result.metrics.uniqueIps.toString()}
            accent="sky"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            }
          />
          <MetricCard
            label="Flagged emails"
            value={result.metrics.flaggedEmails.toString()}
            sub={result.metrics.flaggedEmails > 0 ? "Review required" : "None flagged"}
            accent={result.metrics.flaggedEmails > 0 ? "amber" : undefined}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17.25 4.5 21V8.742m.164-4.078a2.15 2.15 0 011.743-1.342 48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185V19.5M4.664 4.664L19.5 19.5" />
              </svg>
            }
          />
        </div>
 
        {/* Trend chart */}
        {result.dailyTrend.length > 1 && <TrendChart data={result.dailyTrend} />}
 
        {/* Per-email breakdown */}
        {result.emailSummaries.length > 0 && <EmailSummaryTable emails={result.emailSummaries} />}
 
        {/* Full log */}
        <LogTable entries={result.entries} />
 
      </div>
    </div>
  );
}