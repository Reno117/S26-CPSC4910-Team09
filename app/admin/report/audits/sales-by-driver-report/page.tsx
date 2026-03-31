import Link from "next/link";
import {
  getSalesByDriverReport,
  exportSalesByDriverCSV,
  type DriverSalesOrderEntry,
  type DriverSalesSummary,
  type DriverSalesDayBucket,
} from "@/app/actions/admin/sales-by-driver-actions";
import { ExportCSVButton } from "@/app/components/AdminComponents/ExportCSVButton";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; sponsor?: string; view?: string; driver?: string }>;
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
  driver,
}: {
  from: string;
  to: string;
  sponsor: string;
  view: ViewMode;
  driver?: string;
}) {
  const params = new URLSearchParams({ from, to, sponsor, view });
  const normalizedDriver = (driver ?? "").trim();
  if (normalizedDriver) {
    params.set("driver", normalizedDriver);
  }
  return `/admin/report/audits/sales-by-driver-report?${params.toString()}`;
}

function formatTimestamp(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function fmtPoints(n: number) {
  return n.toLocaleString();
}

function fmtStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "cancelled") return "bg-red-50 text-red-700 border-red-200";
  if (s === "delivered") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "shipped") return "bg-violet-50 text-violet-700 border-violet-200";
  if (s === "processing") return "bg-sky-50 text-sky-700 border-sky-200";
  if (s === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "emerald" | "red" | "sky" | "amber";
}) {
  const colors = {
    emerald: "text-emerald-600",
    red: "text-red-600",
    sky: "text-sky-600",
    amber: "text-amber-600",
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

function TrendChart({ data }: { data: DriverSalesDayBucket[] }) {
  const maxPoints = Math.max(...data.map((d) => d.points), 1);
  const labelEvery = Math.ceil(data.length / 7);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">Daily sales trend by driver (active orders)</p>
        <div className="text-xs text-slate-500">Points by order date</div>
      </div>
      <div className="flex items-end gap-px" style={{ height: 120 }}>
        {data.map((d) => {
          const barH = Math.max((d.points / maxPoints) * 100, d.points > 0 ? 2 : 0);
          return (
            <div key={d.date} className="flex-1 flex flex-col justify-end group relative" style={{ height: "100%" }}>
              {d.points > 0 && (
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex flex-col items-center pointer-events-none">
                  <div className="bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                    <p className="font-medium mb-0.5">{d.date}</p>
                    <p className="text-lime-300">{fmtPoints(d.points)} points</p>
                    <p className="text-slate-300">{d.orders} order{d.orders !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-1" />
                </div>
              )}
              <div className="w-full rounded-sm bg-lime-400 hover:bg-lime-500 transition-colors" style={{ height: `${barH}%` }} />
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

function DriverSummaryTable({ drivers }: { drivers: DriverSalesSummary[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Per-driver sales summary</p>
        <p className="text-xs text-slate-400">{drivers.length} drivers</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-2.5">Driver</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-24">Orders</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-24">Sponsors</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-28">Sales</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-28">Cancelled</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 w-28">Avg Order</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d) => (
            <tr key={d.driverId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
              <td className="px-5 py-3">
                <p className="text-slate-800 font-medium">{d.driverName ?? "Unknown"}</p>
                <p className="text-slate-400 text-xs font-mono">{d.driverEmail ?? "—"}</p>
              </td>
              <td className="px-4 py-3 text-slate-700 tabular-nums">{d.totalOrders}</td>
              <td className="px-4 py-3 text-slate-600 tabular-nums">{d.uniqueSponsors}</td>
              <td className="px-4 py-3 text-emerald-600 tabular-nums font-medium">{fmtPoints(d.totalPoints)}</td>
              <td className="px-4 py-3 text-red-500 tabular-nums font-medium">{fmtPoints(d.cancelledPoints)}</td>
              <td className="px-4 py-3 text-slate-700 tabular-nums">{fmtPoints(d.averageOrderPoints)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTable({ entries }: { entries: DriverSalesOrderEntry[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-700">
          Driver sales log
          <span className="ml-2 text-xs font-normal text-slate-400">{entries.length} orders</span>
        </p>
        <p className="text-xs text-slate-400">Newest first</p>
      </div>
      {entries.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-500">No orders found for this date range</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 w-44">Timestamp</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Driver</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Sponsor</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-24">Items</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-28">Points</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-32">Status</th>
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
                    <p className="text-slate-700 text-sm">{entry.driverName ?? "Unknown"}</p>
                    <p className="text-slate-400 text-xs font-mono">{entry.driverEmail ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-slate-700 font-medium">{entry.sponsorName}</td>
                  <td className="px-4 py-3 align-top text-slate-700 tabular-nums">{entry.itemCount}</td>
                  <td className="px-4 py-3 align-top text-slate-800 tabular-nums font-semibold">{fmtPoints(entry.totalPoints)}</td>
                  <td className="px-4 py-3 align-top">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge(entry.status)}`}>
                      {fmtStatus(entry.status)}
                    </span>
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

export default async function SalesByDriverReportPage({ searchParams }: PageProps) {
  const { from, to, sponsor = "All Sponsors", view, driver = "" } = await searchParams;
  const viewMode = getViewMode(view);
  const driverSearch = driver.trim();

  if (!from || !to || from > to) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-sm text-center space-y-4">
          <p className="text-sm font-medium text-slate-700">Invalid report parameters</p>
          <p className="text-xs text-slate-400">Please go back and select a valid date range.</p>
          <Link
            href="/admin/report/audits"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ← Back to filters
          </Link>
        </div>
      </div>
    );
  }

  const result = await getSalesByDriverReport({ dateFrom: from, dateTo: to, sponsor, driver: driverSearch });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/report/audits"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to filters
            </Link>
            <span className="text-slate-200">|</span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Sales by Driver Report</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {from} → {to} · {sponsor} · {viewMode === "summary" ? "Summary" : "Detailed"} view
                {driverSearch ? ` · Driver filter: ${driverSearch}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <Link
                href={buildViewHref({ from, to, sponsor, view: "summary", driver: driverSearch })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "summary"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Summary
              </Link>
              <Link
                href={buildViewHref({ from, to, sponsor, view: "detailed", driver: driverSearch })}
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
              filename={`sales-by-driver-${viewMode}-${from}-to-${to}.csv`}
              fetchCSV={async () => {
                "use server";
                return exportSalesByDriverCSV({ dateFrom: from, dateTo: to, sponsor, driver: driverSearch });
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 py-6 space-y-5">
        <form method="GET" className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
          <input type="hidden" name="from" value={from} />
          <input type="hidden" name="to" value={to} />
          <input type="hidden" name="sponsor" value={sponsor} />
          <input type="hidden" name="view" value={viewMode} />

          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Driver filter</label>
            <input
              type="text"
              name="driver"
              defaultValue={driverSearch}
              placeholder="Search driver by name, email, or ID"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Search
            </button>
            {driverSearch && (
              <Link
                href={buildViewHref({ from, to, sponsor, view: viewMode })}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {viewMode === "summary" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard label="Total orders" value={result.metrics.totalOrders.toLocaleString()} />
            <MetricCard label="Sales points" value={fmtPoints(result.metrics.totalPoints)} accent="emerald" />
            <MetricCard label="Cancelled points" value={fmtPoints(result.metrics.cancelledPoints)} accent="red" />
            <MetricCard label="Net points" value={fmtPoints(result.metrics.netPoints)} accent="sky" />
            <MetricCard label="Drivers" value={result.metrics.uniqueDrivers.toString()} />
            <MetricCard label="Avg order" value={fmtPoints(result.metrics.averageOrderPoints)} accent="amber" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3">
            <MetricCard label="Total orders" value={result.metrics.totalOrders.toLocaleString()} />
            <MetricCard label="Active orders" value={result.metrics.activeOrders.toLocaleString()} accent="emerald" />
            <MetricCard label="Cancelled" value={result.metrics.cancelledOrders.toLocaleString()} accent="red" />
            <MetricCard label="Sales points" value={fmtPoints(result.metrics.totalPoints)} accent="emerald" />
            <MetricCard label="Cancelled points" value={fmtPoints(result.metrics.cancelledPoints)} accent="red" />
            <MetricCard label="Net points" value={fmtPoints(result.metrics.netPoints)} accent="sky" />
            <MetricCard label="Drivers" value={result.metrics.uniqueDrivers.toString()} />
            <MetricCard label="Sponsors" value={result.metrics.uniqueSponsors.toString()} />
            <MetricCard label="Avg order" value={fmtPoints(result.metrics.averageOrderPoints)} accent="amber" />
          </div>
        )}

        {result.dailyTrend.length > 1 && <TrendChart data={result.dailyTrend} />}

        {viewMode === "detailed" && result.statusBreakdown.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Order status breakdown</p>
            <div className="flex flex-wrap gap-2">
              {result.statusBreakdown.map((row) => (
                <span
                  key={row.status}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${statusBadge(row.status)}`}
                >
                  {fmtStatus(row.status)}
                  <span className="tabular-nums">{row.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {result.driverSummaries.length > 0 && <DriverSummaryTable drivers={result.driverSummaries} />}

        {viewMode === "detailed" && <OrdersTable entries={result.entries} />}
      </div>
    </div>
  );
}
