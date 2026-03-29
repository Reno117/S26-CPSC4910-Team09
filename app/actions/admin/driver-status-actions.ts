"use server";
 
import { prisma } from "@/lib/prisma";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
export interface DriverStatusEntry {
  id: string;
  timestamp: string;
  driverId: string;
  driverName: string | null;
  driverEmail: string | null;
  sponsorName: string | null;
  previousStatus: string | null;
  newStatus: string;
  changeReason: string | null;
  changedByType: "sponsor" | "admin" | "system";
  changedByName: string | null;
  changedByEmail: string | null;
}
 
export interface DriverStatusDriverSummary {
  driverId: string;
  driverName: string | null;
  driverEmail: string | null;
  sponsorName: string | null;
  totalChanges: number;
  firstChange: string;
  lastChange: string;
  currentStatus: string;
  statusHistory: { from: string | null; to: string; timestamp: string }[];
  activations: number;
  deactivations: number;
  flaggedActivity: boolean;
  flagReason: string | null;
}
 
export interface DriverStatusDayBucket {
  date: string;
  count: number;
}
 
export interface DriverStatusAuditResult {
  entries: DriverStatusEntry[];
  driverSummaries: DriverStatusDriverSummary[];
  dailyTrend: DriverStatusDayBucket[];
  statusTransitions: { transition: string; count: number }[];
  changedByBreakdown: { type: string; count: number }[];
  metrics: {
    total: number;
    uniqueDrivers: number;
    activations: number;
    deactivations: number;
    flaggedDrivers: number;
    sponsorInitiated: number;
    adminInitiated: number;
  };
}
 
// ─── Constants ────────────────────────────────────────────────────────────────
 
/** Drivers with more than this many status changes in the period are flagged. */
const HIGH_FREQUENCY_THRESHOLD = 3;
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
function parseDateRange(dateFrom: string, dateTo: string): { from: Date; to: Date } {
  if (!dateFrom || !dateTo) {
    throw new Error(`Invalid date range: dateFrom=${dateFrom}, dateTo=${dateTo}`);
  }
  const [fromYear, fromMonth, fromDay] = dateFrom.split("-").map(Number);
  const [toYear, toMonth, toDay] = dateTo.split("-").map(Number);
  if (!fromYear || !fromMonth || !fromDay || !toYear || !toMonth || !toDay) {
    throw new Error(`Could not parse date range: ${dateFrom} - ${dateTo}`);
  }
  const from = new Date(fromYear, fromMonth - 1, fromDay, 0, 0, 0, 0);
  const to = new Date(toYear, toMonth - 1, toDay, 23, 59, 59, 999);
  return { from, to };
}
 
function isDeactivation(status: string): boolean {
  return ["inactive", "suspended", "banned", "rejected", "deactivated"].includes(
    status.toLowerCase()
  );
}
 
function isActivation(status: string): boolean {
  return ["active", "approved", "activated"].includes(status.toLowerCase());
}
 
// ─── Action ───────────────────────────────────────────────────────────────────
 
export async function getDriverStatusReport({
  dateFrom,
  dateTo,
  sponsor,
}: {
  dateFrom: string;
  dateTo: string;
  sponsor: string;
}): Promise<DriverStatusAuditResult> {
  const { from, to } = parseDateRange(dateFrom, dateTo);
 
  // Resolve sponsor filter
  let sponsorIdFilter: string | undefined;
 
  if (sponsor !== "All Sponsors") {
    const found = await prisma.sponsor.findFirst({
      where: { name: sponsor },
      select: { id: true },
    });
    if (found) {
      sponsorIdFilter = found.id;
    }
  }
 
  const raw = await prisma.driverStatusLog.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      ...(sponsorIdFilter
        ? { driver: { sponsorId: sponsorIdFilter } }
        : {}),
    },
    include: {
      driver: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
          sponsor: { select: { name: true } },
        },
      },
      sponsorUser: {
        select: {
          user: { select: { name: true, email: true } },
        },
      },
      admin: {
        select: {
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
 
  // ── Entries ──────────────────────────────────────────────────────────────
  const entries: DriverStatusEntry[] = raw.map((r) => {
    let changedByType: "sponsor" | "admin" | "system" = "system";
    let changedByName: string | null = null;
    let changedByEmail: string | null = null;
 
    if (r.sponsorUser) {
      changedByType = "sponsor";
      changedByName = r.sponsorUser.user?.name ?? null;
      changedByEmail = r.sponsorUser.user?.email ?? null;
    } else if (r.admin) {
      changedByType = "admin";
      changedByName = r.admin.user?.name ?? null;
      changedByEmail = r.admin.user?.email ?? null;
    }
 
    return {
      id: r.id,
      timestamp: r.createdAt.toISOString(),
      driverId: r.driverId,
      driverName: r.driver.user?.name ?? null,
      driverEmail: r.driver.user?.email ?? null,
      sponsorName: r.driver.sponsor?.name ?? null,
      previousStatus: r.previousStatus ?? null,
      newStatus: r.newStatus,
      changeReason: r.changeReason ?? null,
      changedByType,
      changedByName,
      changedByEmail,
    };
  });
 
  // ── Per-driver summaries ─────────────────────────────────────────────────
  const driverMap = new Map<
    string,
    {
      driverId: string;
      driverName: string | null;
      driverEmail: string | null;
      sponsorName: string | null;
      changes: { from: string | null; to: string; timestamp: string }[];
    }
  >();
 
  for (const e of entries) {
    if (!driverMap.has(e.driverId)) {
      driverMap.set(e.driverId, {
        driverId: e.driverId,
        driverName: e.driverName,
        driverEmail: e.driverEmail,
        sponsorName: e.sponsorName,
        changes: [],
      });
    }
    driverMap.get(e.driverId)!.changes.push({
      from: e.previousStatus,
      to: e.newStatus,
      timestamp: e.timestamp,
    });
  }
 
  const driverSummaries: DriverStatusDriverSummary[] = [];
  for (const d of driverMap.values()) {
    const sorted = [...d.changes].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const totalChanges = d.changes.length;
    const activations = d.changes.filter((c) => isActivation(c.to)).length;
    const deactivations = d.changes.filter((c) => isDeactivation(c.to)).length;
    const currentStatus = sorted[sorted.length - 1]?.to ?? "unknown";
 
    let flaggedActivity = false;
    let flagReason: string | null = null;
 
    if (totalChanges > HIGH_FREQUENCY_THRESHOLD) {
      flaggedActivity = true;
      flagReason = `${totalChanges} status changes in period (threshold: ${HIGH_FREQUENCY_THRESHOLD})`;
    } else if (activations > 0 && deactivations > 0) {
      flaggedActivity = true;
      flagReason = `Toggled between active/inactive states`;
    }
 
    driverSummaries.push({
      driverId: d.driverId,
      driverName: d.driverName,
      driverEmail: d.driverEmail,
      sponsorName: d.sponsorName,
      totalChanges,
      firstChange: sorted[0]?.timestamp ?? "",
      lastChange: sorted[sorted.length - 1]?.timestamp ?? "",
      currentStatus,
      statusHistory: sorted,
      activations,
      deactivations,
      flaggedActivity,
      flagReason,
    });
  }
 
  driverSummaries.sort((a, b) => {
    if (a.flaggedActivity !== b.flaggedActivity) return a.flaggedActivity ? -1 : 1;
    return b.totalChanges - a.totalChanges;
  });
 
  // ── Daily trend ──────────────────────────────────────────────────────────
  const dayMap = new Map<string, number>();
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key = cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dayMap.set(key, 0);
    cursor.setDate(cursor.getDate() + 1);
  }
 
  for (const e of entries) {
    const key = new Date(e.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
  }
 
  const dailyTrend: DriverStatusDayBucket[] = Array.from(dayMap.entries()).map(
    ([date, count]) => ({ date, count })
  );
 
  // ── Status transitions ───────────────────────────────────────────────────
  const transitionMap = new Map<string, number>();
  for (const e of entries) {
    const key = `${e.previousStatus ?? "—"} → ${e.newStatus}`;
    transitionMap.set(key, (transitionMap.get(key) ?? 0) + 1);
  }
  const statusTransitions = Array.from(transitionMap.entries())
    .map(([transition, count]) => ({ transition, count }))
    .sort((a, b) => b.count - a.count);
 
  // ── Changed-by breakdown ─────────────────────────────────────────────────
  const changedByMap = new Map<string, number>();
  for (const e of entries) {
    const key =
      e.changedByType === "sponsor"
        ? "Sponsor"
        : e.changedByType === "admin"
        ? "Admin"
        : "System";
    changedByMap.set(key, (changedByMap.get(key) ?? 0) + 1);
  }
  const changedByBreakdown = Array.from(changedByMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
 
  // ── Top-level metrics ────────────────────────────────────────────────────
  const total = entries.length;
  const uniqueDrivers = driverMap.size;
  const activations = entries.filter((e) => isActivation(e.newStatus)).length;
  const deactivations = entries.filter((e) => isDeactivation(e.newStatus)).length;
  const flaggedDrivers = driverSummaries.filter((d) => d.flaggedActivity).length;
  const sponsorInitiated = entries.filter((e) => e.changedByType === "sponsor").length;
  const adminInitiated = entries.filter((e) => e.changedByType === "admin").length;
 
  return {
    entries,
    driverSummaries,
    dailyTrend,
    statusTransitions,
    changedByBreakdown,
    metrics: {
      total,
      uniqueDrivers,
      activations,
      deactivations,
      flaggedDrivers,
      sponsorInitiated,
      adminInitiated,
    },
  };
}
 
// ─── CSV Export ───────────────────────────────────────────────────────────────
 
export async function exportDriverStatusCSV({
  dateFrom,
  dateTo,
  sponsor,
}: {
  dateFrom: string;
  dateTo: string;
  sponsor: string;
}): Promise<string> {
  const result = await getDriverStatusReport({ dateFrom, dateTo, sponsor });
 
  const header = [
    "ID",
    "Timestamp",
    "Driver Name",
    "Driver Email",
    "Sponsor",
    "Previous Status",
    "New Status",
    "Changed By",
    "Changed By Name",
    "Change Reason",
  ].join(",");
 
  const rows = result.entries.map((e) => {
    const ts = new Date(e.timestamp).toLocaleString("en-US");
    return [
      e.id,
      `"${ts}"`,
      `"${e.driverName ?? ""}"`,
      `"${e.driverEmail ?? ""}"`,
      `"${e.sponsorName ?? ""}"`,
      `"${e.previousStatus ?? ""}"`,
      `"${e.newStatus}"`,
      `"${e.changedByType}"`,
      `"${e.changedByName ?? ""}"`,
      `"${(e.changeReason ?? "").replace(/"/g, "'")}"`,
    ].join(",");
  });
 
  return [header, ...rows].join("\n");
}