"use server";

import { prisma } from "@/lib/prisma";

export interface SalesOrderEntry {
  id: string;
  timestamp: string;
  sponsorId: string;
  sponsorName: string;
  driverId: string;
  driverName: string | null;
  driverEmail: string | null;
  totalPoints: number;
  itemCount: number;
  status: string;
}

export interface SalesSponsorSummary {
  sponsorId: string;
  sponsorName: string;
  totalOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  totalPoints: number;
  cancelledPoints: number;
  netPoints: number;
  averageOrderPoints: number;
  largestOrderPoints: number;
  uniqueDrivers: number;
}

export interface SalesDayBucket {
  date: string;
  points: number;
  orders: number;
}

export interface SalesBySponsorResult {
  entries: SalesOrderEntry[];
  sponsorSummaries: SalesSponsorSummary[];
  dailyTrend: SalesDayBucket[];
  statusBreakdown: { status: string; count: number }[];
  metrics: {
    totalOrders: number;
    activeOrders: number;
    cancelledOrders: number;
    totalPoints: number;
    cancelledPoints: number;
    netPoints: number;
    uniqueSponsors: number;
    uniqueDrivers: number;
    averageOrderPoints: number;
  };
}

function parseDateRange(dateFrom: string, dateTo: string): { from: Date; to: Date } {
  const [fromYear, fromMonth, fromDay] = dateFrom.split("-").map(Number);
  const [toYear, toMonth, toDay] = dateTo.split("-").map(Number);
  const from = new Date(fromYear, fromMonth - 1, fromDay, 0, 0, 0, 0);
  const to = new Date(toYear, toMonth - 1, toDay, 23, 59, 59, 999);
  return { from, to };
}

export async function getSalesBySponsorReport({
  dateFrom,
  dateTo,
  sponsor,
}: {
  dateFrom: string;
  dateTo: string;
  sponsor: string;
}): Promise<SalesBySponsorResult> {
  const { from, to } = parseDateRange(dateFrom, dateTo);

  let sponsorIdFilter: string | undefined;
  if (sponsor !== "All Sponsors") {
    const found = await prisma.sponsor.findFirst({
      where: { name: sponsor },
      select: { id: true },
    });
    sponsorIdFilter = found?.id;
  }

  const raw = await prisma.order.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      ...(sponsorIdFilter ? { sponsorId: sponsorIdFilter } : {}),
    },
    include: {
      sponsor: { select: { id: true, name: true } },
      driverProfile: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
        },
      },
      items: {
        select: {
          quantity: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const entries: SalesOrderEntry[] = raw.map((r) => ({
    id: r.id,
    timestamp: r.createdAt.toISOString(),
    sponsorId: r.sponsor.id,
    sponsorName: r.sponsor.name,
    driverId: r.driverProfile.id,
    driverName: r.driverProfile.user?.name ?? null,
    driverEmail: r.driverProfile.user?.email ?? null,
    totalPoints: r.totalPoints,
    itemCount: r.items.reduce((sum, item) => sum + item.quantity, 0),
    status: r.status,
  }));

  const activeEntries = entries.filter((e) => e.status !== "cancelled");
  const cancelledEntries = entries.filter((e) => e.status === "cancelled");

  const sponsorMap = new Map<string, SalesSponsorSummary>();
  const sponsorDriverSets = new Map<string, Set<string>>();

  for (const e of entries) {
    if (!sponsorMap.has(e.sponsorId)) {
      sponsorMap.set(e.sponsorId, {
        sponsorId: e.sponsorId,
        sponsorName: e.sponsorName,
        totalOrders: 0,
        activeOrders: 0,
        cancelledOrders: 0,
        totalPoints: 0,
        cancelledPoints: 0,
        netPoints: 0,
        averageOrderPoints: 0,
        largestOrderPoints: 0,
        uniqueDrivers: 0,
      });
      sponsorDriverSets.set(e.sponsorId, new Set<string>());
    }

    const s = sponsorMap.get(e.sponsorId)!;
    s.totalOrders += 1;
    s.largestOrderPoints = Math.max(s.largestOrderPoints, e.totalPoints);

    sponsorDriverSets.get(e.sponsorId)!.add(e.driverId);

    if (e.status === "cancelled") {
      s.cancelledOrders += 1;
      s.cancelledPoints += e.totalPoints;
    } else {
      s.activeOrders += 1;
      s.totalPoints += e.totalPoints;
    }
  }

  const sponsorSummaries = Array.from(sponsorMap.values())
    .map((s) => {
      s.netPoints = s.totalPoints - s.cancelledPoints;
      s.averageOrderPoints = s.activeOrders > 0 ? Math.round(s.totalPoints / s.activeOrders) : 0;
      s.uniqueDrivers = sponsorDriverSets.get(s.sponsorId)?.size ?? 0;
      return s;
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const dayMap = new Map<string, { points: number; orders: number }>();
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key = cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dayMap.set(key, { points: 0, orders: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const e of activeEntries) {
    const key = new Date(e.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const bucket = dayMap.get(key);
    if (bucket) {
      bucket.points += e.totalPoints;
      bucket.orders += 1;
    }
  }

  const dailyTrend: SalesDayBucket[] = Array.from(dayMap.entries()).map(([date, v]) => ({
    date,
    points: v.points,
    orders: v.orders,
  }));

  const statusMap = new Map<string, number>();
  for (const e of entries) {
    statusMap.set(e.status, (statusMap.get(e.status) ?? 0) + 1);
  }

  const statusBreakdown = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const totalPoints = activeEntries.reduce((sum, e) => sum + e.totalPoints, 0);
  const cancelledPoints = cancelledEntries.reduce((sum, e) => sum + e.totalPoints, 0);

  return {
    entries,
    sponsorSummaries,
    dailyTrend,
    statusBreakdown,
    metrics: {
      totalOrders: entries.length,
      activeOrders: activeEntries.length,
      cancelledOrders: cancelledEntries.length,
      totalPoints,
      cancelledPoints,
      netPoints: totalPoints - cancelledPoints,
      uniqueSponsors: new Set(entries.map((e) => e.sponsorId)).size,
      uniqueDrivers: new Set(entries.map((e) => e.driverId)).size,
      averageOrderPoints: activeEntries.length > 0 ? Math.round(totalPoints / activeEntries.length) : 0,
    },
  };
}

export async function exportSalesBySponsorCSV({
  dateFrom,
  dateTo,
  sponsor,
}: {
  dateFrom: string;
  dateTo: string;
  sponsor: string;
}): Promise<string> {
  const result = await getSalesBySponsorReport({ dateFrom, dateTo, sponsor });

  const header = [
    "Order ID",
    "Timestamp",
    "Sponsor",
    "Driver Name",
    "Driver Email",
    "Items",
    "Total Points",
    "Status",
  ].join(",");

  const rows = result.entries.map((e) => {
    const ts = new Date(e.timestamp).toLocaleString("en-US");
    return [
      `"${e.id}"`,
      `"${ts}"`,
      `"${e.sponsorName.replace(/"/g, '""')}"`,
      `"${(e.driverName ?? "").replace(/"/g, '""')}"`,
      `"${(e.driverEmail ?? "").replace(/"/g, '""')}"`,
      e.itemCount,
      e.totalPoints,
      `"${e.status}"`,
    ].join(",");
  });

  return [header, ...rows].join("\n");
}
