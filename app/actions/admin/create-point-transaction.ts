"use server";
 
import { prisma } from "@/lib/prisma";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
export interface PointChangeEntry {
  id: string;
  timestamp: string;
  driverName: string | null;
  driverEmail: string | null;
  driverId: string;
  sponsorName: string;
  sponsorId: string;
  amount: number;
  reason: string;
  changedByName: string | null;
  changedByEmail: string | null;
}
 
export interface PointChangeDriverSummary {
  driverId: string;
  driverName: string | null;
  driverEmail: string | null;
  sponsorName: string;
  totalAdded: number;
  totalDeducted: number;
  netChange: number;
  changeCount: number;
  largestSingle: number;
}
 
export interface PointChangeSponsorSummary {
  sponsorId: string;
  sponsorName: string;
  totalAdded: number;
  totalDeducted: number;
  netChange: number;
  changeCount: number;
  driversAffected: number;
}
 
export interface PointChangeDayBucket {
  date: string;
  added: number;
  deducted: number;
}
 
export interface PointChangeAuditResult {
  entries: PointChangeEntry[];
  driverSummaries: PointChangeDriverSummary[];
  sponsorSummaries: PointChangeSponsorSummary[];
  dailyTrend: PointChangeDayBucket[];
  metrics: {
    total: number;
    totalAdded: number;
    totalDeducted: number;
    netChange: number;
    uniqueDrivers: number;
    uniqueSponsors: number;
    largestSingleChange: number;
  };
}
 
// ─── Action ───────────────────────────────────────────────────────────────────
 
export async function getPointChangeAuditReport({
  dateFrom,
  dateTo,
  sponsor,
}: {
  dateFrom: string;
  dateTo: string;
  sponsor: string;
}): Promise<PointChangeAuditResult> {
  const [fromYear, fromMonth, fromDay] = dateFrom.split("-").map(Number);
  const [toYear, toMonth, toDay] = dateTo.split("-").map(Number);
  const from = new Date(fromYear, fromMonth - 1, fromDay, 0, 0, 0, 0);
  const to = new Date(toYear, toMonth - 1, toDay, 23, 59, 59, 999);
 
  // Resolve sponsorId filter
  let sponsorIdFilter: string | undefined;
  if (sponsor !== "All Sponsors") {
    const found = await prisma.sponsor.findFirst({
      where: { name: sponsor },
      select: { id: true },
    });
    sponsorIdFilter = found?.id;
  }
 
  const raw = await prisma.pointChange.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      ...(sponsorIdFilter ? { sponsorId: sponsorIdFilter } : {}),
    },
    include: {
      driverProfile: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
        },
      },
      sponsor: { select: { id: true, name: true } },
      changedByUser: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
 
  // ── Entries ──────────────────────────────────────────────────────────────
  const entries: PointChangeEntry[] = raw.map((r) => ({
    id: r.id,
    timestamp: r.createdAt.toISOString(),
    driverName: r.driverProfile.user?.name ?? null,
    driverEmail: r.driverProfile.user?.email ?? null,
    driverId: r.driverProfileId,
    sponsorName: r.sponsor.name,
    sponsorId: r.sponsor.id,
    amount: r.amount,
    reason: r.reason,
    changedByName: r.changedByUser?.name ?? null,
    changedByEmail: r.changedByUser?.email ?? null,
  }));
 
  // ── Per-driver summaries ─────────────────────────────────────────────────
  const driverMap = new Map<string, PointChangeDriverSummary>();
  for (const e of entries) {
    if (!driverMap.has(e.driverId)) {
      driverMap.set(e.driverId, {
        driverId: e.driverId,
        driverName: e.driverName,
        driverEmail: e.driverEmail,
        sponsorName: e.sponsorName,
        totalAdded: 0,
        totalDeducted: 0,
        netChange: 0,
        changeCount: 0,
        largestSingle: 0,
      });
    }
    const d = driverMap.get(e.driverId)!;
    d.changeCount++;
    if (e.amount > 0) d.totalAdded += e.amount;
    else d.totalDeducted += Math.abs(e.amount);
    d.netChange += e.amount;
    if (Math.abs(e.amount) > d.largestSingle) d.largestSingle = Math.abs(e.amount);
  }
 
  const driverSummaries = Array.from(driverMap.values()).sort(
    (a, b) => Math.abs(b.netChange) - Math.abs(a.netChange)
  );
 
  // ── Per-sponsor summaries ────────────────────────────────────────────────
  const sponsorMap = new Map<string, PointChangeSponsorSummary>();
  for (const e of entries) {
    if (!sponsorMap.has(e.sponsorId)) {
      sponsorMap.set(e.sponsorId, {
        sponsorId: e.sponsorId,
        sponsorName: e.sponsorName,
        totalAdded: 0,
        totalDeducted: 0,
        netChange: 0,
        changeCount: 0,
        driversAffected: 0,
      });
    }
    const s = sponsorMap.get(e.sponsorId)!;
    s.changeCount++;
    if (e.amount > 0) s.totalAdded += e.amount;
    else s.totalDeducted += Math.abs(e.amount);
    s.netChange += e.amount;
  }
  // Count unique drivers per sponsor
  for (const s of sponsorMap.values()) {
    s.driversAffected = driverSummaries.filter(
      (d) => d.sponsorName === s.sponsorName
    ).length;
  }
 
  const sponsorSummaries = Array.from(sponsorMap.values()).sort(
    (a, b) => b.changeCount - a.changeCount
  );
 
  // ── Daily trend ──────────────────────────────────────────────────────────
  const dayMap = new Map<string, { added: number; deducted: number }>();
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key = cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dayMap.set(key, { added: 0, deducted: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
 
  for (const e of entries) {
    const key = new Date(e.timestamp).toLocaleDateString("en-US", {
      month: "short", day: "numeric",
    });
    const bucket = dayMap.get(key);
    if (bucket) {
      if (e.amount > 0) bucket.added += e.amount;
      else bucket.deducted += Math.abs(e.amount);
    }
  }
 
  const dailyTrend: PointChangeDayBucket[] = Array.from(dayMap.entries()).map(
    ([date, v]) => ({ date, ...v })
  );
 
  // ── Top-level metrics ────────────────────────────────────────────────────
  const totalAdded = entries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const totalDeducted = entries.filter((e) => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);
  const largestSingleChange = entries.reduce((max, e) => Math.max(max, Math.abs(e.amount)), 0);
 
  return {
    entries,
    driverSummaries,
    sponsorSummaries,
    dailyTrend,
    metrics: {
      total: entries.length,
      totalAdded,
      totalDeducted,
      netChange: totalAdded - totalDeducted,
      uniqueDrivers: driverMap.size,
      uniqueSponsors: sponsorMap.size,
      largestSingleChange,
    },
  };
}
 
// ─── CSV Export ───────────────────────────────────────────────────────────────
 
export async function exportPointChangeAuditCSV({
  dateFrom,
  dateTo,
  sponsor,
}: {
  dateFrom: string;
  dateTo: string;
  sponsor: string;
}): Promise<string> {
  const result = await getPointChangeAuditReport({ dateFrom, dateTo, sponsor });
 
  const header = [
    "ID", "Timestamp", "Driver Name", "Driver Email",
    "Sponsor", "Amount", "Type", "Reason", "Changed By",
  ].join(",");
 
  const rows = result.entries.map((e) => {
    const ts = new Date(e.timestamp).toLocaleString("en-US");
    const type = e.amount > 0 ? "Added" : "Deducted";
    return [
      `"${e.id}"`,
      `"${ts}"`,
      `"${e.driverName ?? ""}"`,
      `"${e.driverEmail ?? ""}"`,
      `"${e.sponsorName}"`,
      Math.abs(e.amount),
      type,
      `"${e.reason.replace(/"/g, '""')}"`,
      `"${e.changedByEmail ?? ""}"`,
    ].join(",");
  });
 
  return [header, ...rows].join("\n");
}