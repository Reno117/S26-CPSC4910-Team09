"use client";
 
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSponsors,
  getAuditLogs,
  type AuditEntry,
  type AuditCategory,
  type LogStatus,
} from "@/app/actions/admin/audit-report-actions";
import AdminHeader from "@/app/components/AdminComponents/AdminHeader";
 
// ─── Constants ────────────────────────────────────────────────────────────────
 
const CATEGORIES: AuditCategory[] = [
  "Password Change",
  "Driver Status",
  "Login Attempts",
  "Point Change",
  "Sales by Sponsor",
];
 
// Categories that have their own dedicated report page
const ROUTED_CATEGORIES: Partial<Record<AuditCategory, string>> = {
  "Login Attempts": "/admin/report/audits/login-attempts-report",
  "Point Change":   "/admin/report/audits/point-change-report",
  "Password Change": "/admin/report/audits/password-change-report",
  "Driver Status":  "/admin/report/audits/driver-status-report",
  "In Depth Point Change": "/admin/report/audits/in-depth-point-report",
  "Sales by Sponsor": "/admin/report/audits/sales-by-sponsor-report",
};
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
function formatTimestamp(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}
 
const STATUS_CONFIG: Record<LogStatus, { label: string; classes: string; dot: string }> = {
  success: { label: "Success", classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  warning: { label: "Warning", classes: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  error:   { label: "Error",   classes: "bg-red-50 text-red-700 border-red-200",              dot: "bg-red-500"   },
  info:    { label: "Info",    classes: "bg-sky-50 text-sky-700 border-sky-200",              dot: "bg-sky-500"   },
};
 
const CATEGORY_COLORS: Record<AuditCategory, string> = {
  "Password Change": "bg-violet-50 text-violet-700 border-violet-200",
  "Driver Status":   "bg-teal-50 text-teal-700 border-teal-200",
  "Login Attempts":  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Point Change":    "bg-orange-50 text-orange-700 border-orange-200",
  "In Depth Point Change":  "bg-pink-50 text-pink-700 border-pink-200", 
  "Sales by Sponsor": "bg-cyan-50 text-cyan-700 border-cyan-200",

};
 
// ─── Sub-components ───────────────────────────────────────────────────────────
 
function StatusBadge({ status }: { status: LogStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
 
function CategoryBadge({ category }: { category: AuditCategory }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${CATEGORY_COLORS[category]}`}>
      {category}
    </span>
  );
}
 
function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
 
// ─── Page ─────────────────────────────────────────────────────────────────────
 
export default function AuditReportPage() {
  const router = useRouter();
 
  // Filter form state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sponsor, setSponsor] = useState("All Sponsors");
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | null>(null);
 
  // Sponsor dropdown — lazy loaded from DB on first focus
  const [sponsors, setSponsors] = useState<string[]>([]);
  const [sponsorsLoaded, setSponsorsLoaded] = useState(false);
 
  // Results state
  const [results, setResults] = useState<AuditEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<{
    dateFrom: string;
    dateTo: string;
    sponsor: string;
    category: AuditCategory;
  } | null>(null);
 
  const selectCategory = (cat: AuditCategory) => {
    setSelectedCategory((prev) => (prev === cat ? null : cat));
    setValidationError(null);
  };
 
  const handleSponsorFocus = async () => {
    if (sponsorsLoaded) return;
    const names = await getSponsors();
    setSponsors(["All Sponsors", ...names]);
    setSponsorsLoaded(true);
  };
 
  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      setValidationError("Please select a start and end date.");
      return;
    }
    if (dateFrom > dateTo) {
      setValidationError("Start date must be on or before end date.");
      return;
    }
    if (!selectedCategory) {
      setValidationError("Please select an audit log category.");
      return;
    }
 
    setValidationError(null);
 
    // Route to dedicated page if one exists for this category
    if (ROUTED_CATEGORIES[selectedCategory]) {
      const params = new URLSearchParams({ from: dateFrom, to: dateTo, sponsor });
      router.push(`${ROUTED_CATEGORIES[selectedCategory]}?${params.toString()}`);
      return;
    }
 
    // Otherwise render inline
    setLoading(true);
    setExpandedId(null);
    const entries = await getAuditLogs({ dateFrom, dateTo, sponsor, categories: [selectedCategory] });
    setResults(entries);
    setAppliedFilters({ dateFrom, dateTo, sponsor, category: selectedCategory });
    setLoading(false);
  };
 
  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setSponsor("All Sponsors");
    setSelectedCategory(null);
    setResults(null);
    setAppliedFilters(null);
    setValidationError(null);
    setExpandedId(null);
    setLoading(false);
  };
 
  const metrics = results
    ? {
        total: results.length,
        errors: results.filter((e) => e.status === "error").length,
        warnings: results.filter((e) => e.status === "warning").length,
        uniqueSponsors: new Set(results.map((e) => e.sponsor)).size,
      }
    : null;
 
  const canGenerate = !!dateFrom && !!dateTo && !!selectedCategory;
  const willRoute = !!selectedCategory && !!ROUTED_CATEGORIES[selectedCategory];
 
  const MIN_DATE = "2026-01-01";
  const MAX_DATE = new Date().toISOString().slice(0, 10);
 
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <AdminHeader />
 
      {/* ── Page header ── */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 pt-24">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>
 
          {appliedFilters && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Reset
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export CSV
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                Print
              </button>
            </div>
          )}
        </div>
      </div>
 
      <div className="max-w-screen-xl mx-auto px-8 py-6 space-y-5">
 
        {/* ── Filter / criteria panel ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Report criteria</p>
 
          {/* Row 1: Date range + Sponsor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 
            {/* Date range */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Date range <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  min={MIN_DATE}
                  max={MAX_DATE}
                  onChange={(e) => { setDateFrom(e.target.value); setValidationError(null); }}
                  className={`h-9 flex-1 px-3 text-sm border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                    !dateFrom && validationError ? "border-red-300 bg-red-50" : "border-slate-200"
                  }`}
                />
                <span className="text-slate-400 text-sm flex-shrink-0">to</span>
                <input
                  type="date"
                  value={dateTo}
                  min={MIN_DATE}
                  max={MAX_DATE}
                  onChange={(e) => { setDateTo(e.target.value); setValidationError(null); }}
                  className={`h-9 flex-1 px-3 text-sm border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                    !dateTo && validationError ? "border-red-300 bg-red-50" : "border-slate-200"
                  }`}
                />
              </div>
            </div>
 
            {/* Sponsor */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Sponsor</label>
              <select
                value={sponsor}
                onFocus={handleSponsorFocus}
                onChange={(e) => setSponsor(e.target.value)}
                className="h-9 w-full px-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {!sponsorsLoaded && <option>All Sponsors</option>}
                {sponsors.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
 
          {/* Row 2: Category single-select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Audit log category <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {selectedCategory ? "1 selected" : "None selected"}
              </span>
            </div>
            <div
              className={`flex flex-wrap gap-2 p-3 rounded-lg border transition-colors ${
                !selectedCategory && validationError
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                const isRouted = !!ROUTED_CATEGORIES[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => selectCategory(cat)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      active
                        ? `${CATEGORY_COLORS[cat]} shadow-sm`
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                    }`}
                  >
                    {cat}
                    {isRouted && (
                      <span className="ml-1.5 text-[10px] opacity-50">↗</span>
                    )}
                  </button>
                );
              })}
            </div>
 

          </div>
 
          {/* Validation error */}
          {validationError && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-red-700">{validationError}</p>
            </div>
          )}
 
          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <p className="text-xs text-slate-400"><span className="text-red-500">*</span> Required to generate report</p>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                canGenerate && !loading
                  ? "bg-slate-900 text-white hover:bg-slate-700 cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Generating…
                </>
              ) : willRoute ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Open report
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                  </svg>
                  Generate report
                </>
              )}
            </button>
          </div>
        </div>
 
        {/* ── Idle placeholder ── */}
        {!appliedFilters && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">No report generated yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Choose a date range, sponsor, and a category above, then click Generate report.
            </p>
          </div>
        )}
 
        {/* ── Results ── */}
        {appliedFilters && results && metrics && (
          <>
            {/* Filter summary strip */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600">
              <span className="font-medium text-slate-700 mr-1">Showing:</span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md tabular-nums">
                {appliedFilters.dateFrom} → {appliedFilters.dateTo}
              </span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                {appliedFilters.sponsor}
              </span>
              <span className={`px-2 py-0.5 border rounded-md ${CATEGORY_COLORS[appliedFilters.category]}`}>
                {appliedFilters.category}
              </span>
            </div>
 
            {/* Metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Total entries"  value={metrics.total.toLocaleString()} />
              <MetricCard label="Sponsors"       value={metrics.uniqueSponsors.toString()} />
              <MetricCard label="Errors"         value={metrics.errors.toString()}   sub={metrics.errors   > 0 ? "Requires attention" : "All clear"} />
              <MetricCard label="Warnings"       value={metrics.warnings.toString()} sub={metrics.warnings > 0 ? "Review recommended" : "All clear"} />
            </div>
 
            {/* Log table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-700">
                  {results.length} {results.length === 1 ? "entry" : "entries"} found
                </p>
                <p className="text-xs text-slate-400">Click a row to expand details</p>
              </div>
 
              {results.length === 0 ? (
                <div className="py-16 text-center">
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  <p className="text-sm text-slate-500">No entries match your criteria</p>
                  <p className="text-xs text-slate-400 mt-1">Try a wider date range or a different category</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 w-40">Timestamp</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-36">Sponsor</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Category</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Action</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-44">Performed by</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((entry) => {
                      const { date, time } = formatTimestamp(entry.timestamp);
                      const isExpanded = expandedId === entry.id;
                      return (
                        <Fragment key={entry.id}>
                          <tr
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            className={`border-b border-slate-100 cursor-pointer transition-colors ${
                              isExpanded ? "bg-slate-50" : "hover:bg-slate-50/60"
                            }`}
                          >
                            <td className="px-5 py-3 align-top">
                              <p className="text-slate-800 font-medium tabular-nums">{date}</p>
                              <p className="text-slate-400 text-xs tabular-nums">{time}</p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <p className="text-slate-700 font-medium">{entry.sponsor}</p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <CategoryBadge category={entry.category} />
                            </td>
                            <td className="px-4 py-3 align-top">
                              <p className="text-slate-800">{entry.action}</p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <p className="text-slate-600 text-xs font-mono">{entry.performedBy}</p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <StatusBadge status={entry.status} />
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <td colSpan={6} className="px-5 py-3">
                                <div className="flex items-start gap-3">
                                  <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                  </svg>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-0.5">Details</p>
                                    <p className="text-sm text-slate-700">{entry.details}</p>
                                    <p className="text-xs text-slate-400 mt-1 font-mono">Entry ID: {entry.id}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
 
      </div>
    </div>
  );
}