"use server";

import { prisma } from "@/lib/prisma";

export interface DriverSalesOrderEntry {
  id: string;
  timestamp: string;
  driverId: string;
  driverName: string | null;
  driverEmail: string | null;
  sponsorId: string;
  sponsorName: string;
  totalPoints: number;
  itemCount: number;
  status: string;
}

export interface DriverSalesSummary {
  driverId: string;
  driverName: string | null;
  driverEmail: string | null;
  totalOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  totalPoints: number;
  cancelledPoints: number;
  netPoints: number;
  averageOrderPoints: number;
  largestOrderPoints: number;
  uniqueSponsors: number;
}

export interface DriverSalesDayBucket {
  date: string;
  points: number;
  orders: number;
}

export interface SalesByDriverResult {
  entries: DriverSalesOrderEntry[];
  driverSummaries: DriverSalesSummary[];
  dailyTrend: DriverSalesDayBucket[];
  statusBreakdown: { status: string; count: number }[];
  metrics: {
    totalOrders: number;
    activeOrders: number;
    cancelledOrders: number;
    totalPoints: number;
    cancelledPoints: number;
    netPoints: number;
    uniqueDrivers: number;
    uniqueSponsors: number;
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

export async function getSalesByDriverReport({
  dateFrom,
  dateTo,
  sponsor,
  driver,
}: {
  dateFrom: string;
  dateTo: string;
  sponsor: string;
  driver?: string;
}): Promise<SalesByDriverResult> {
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
      items: { select: { quantity: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const entries: DriverSalesOrderEntry[] = raw.map((r) => ({
    id: r.id,
    timestamp: r.createdAt.toISOString(),
    driverId: r.driverProfile.id,
    driverName: r.driverProfile.user?.name ?? null,
    driverEmail: r.driverProfile.user?.email ?? null,
    sponsorId: r.sponsor.id,
    sponsorName: r.sponsor.name,
    totalPoints: r.totalPoints,
    itemCount: r.items.reduce((sum, item) => sum + item.quantity, 0),
    status: r.status,
  }));

  const normalizedDriver = (driver ?? "").trim().toLowerCase();
  const filteredEntries = normalizedDriver
    ? entries.filter((e) => {
        const name = (e.driverName ?? "").toLowerCase();
        const email = (e.driverEmail ?? "").toLowerCase();
        return (
          name === normalizedDriver ||
          email === normalizedDriver
        );
      })
    : entries;

  const activeEntries = filteredEntries.filter((e) => e.status !== "cancelled");
  const cancelledEntries = filteredEntries.filter((e) => e.status === "cancelled");

  const driverMap = new Map<string, DriverSalesSummary>();
  const driverSponsorSets = new Map<string, Set<string>>();

  for (const e of filteredEntries) {
    if (!driverMap.has(e.driverId)) {
      driverMap.set(e.driverId, {
        driverId: e.driverId,
        driverName: e.driverName,
        driverEmail: e.driverEmail,
        totalOrders: 0,
        activeOrders: 0,
        cancelledOrders: 0,
        totalPoints: 0,
        cancelledPoints: 0,
        netPoints: 0,
        averageOrderPoints: 0,
        largestOrderPoints: 0,
        uniqueSponsors: 0,
      });
      driverSponsorSets.set(e.driverId, new Set<string>());
    }

    const d = driverMap.get(e.driverId)!;
    d.totalOrders += 1;
    d.largestOrderPoints = Math.max(d.largestOrderPoints, e.totalPoints);
    driverSponsorSets.get(e.driverId)!.add(e.sponsorId);

    if (e.status === "cancelled") {
      d.cancelledOrders += 1;
      d.cancelledPoints += e.totalPoints;
    } else {
      d.activeOrders += 1;
      d.totalPoints += e.totalPoints;
    }
  }

  const driverSummaries = Array.from(driverMap.values())
    .map((d) => {
      d.netPoints = d.totalPoints - d.cancelledPoints;
      d.averageOrderPoints = d.activeOrders > 0 ? Math.round(d.totalPoints / d.activeOrders) : 0;
      d.uniqueSponsors = driverSponsorSets.get(d.driverId)?.size ?? 0;
      return d;
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

  const dailyTrend: DriverSalesDayBucket[] = Array.from(dayMap.entries()).map(([date, v]) => ({
    date,
    points: v.points,
    orders: v.orders,
  }));

  const statusMap = new Map<string, number>();
  for (const e of filteredEntries) {
    statusMap.set(e.status, (statusMap.get(e.status) ?? 0) + 1);
  }

  const statusBreakdown = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const totalPoints = activeEntries.reduce((sum, e) => sum + e.totalPoints, 0);
  const cancelledPoints = cancelledEntries.reduce((sum, e) => sum + e.totalPoints, 0);

  return {
    entries: filteredEntries,
    driverSummaries,
    dailyTrend,
    statusBreakdown,
    metrics: {
      totalOrders: filteredEntries.length,
      activeOrders: activeEntries.length,
      cancelledOrders: cancelledEntries.length,
      totalPoints,
      cancelledPoints,
      netPoints: totalPoints - cancelledPoints,
      uniqueDrivers: new Set(filteredEntries.map((e) => e.driverId)).size,
      uniqueSponsors: new Set(filteredEntries.map((e) => e.sponsorId)).size,
      averageOrderPoints: activeEntries.length > 0 ? Math.round(totalPoints / activeEntries.length) : 0,
    },
  };
}

export async function exportSalesByDriverCSV({
  dateFrom,
  dateTo,
  sponsor,
  driver,
}: {
  dateFrom: string;
  dateTo: string;
  sponsor: string;
  driver?: string;
}): Promise<string> {
  const result = await getSalesByDriverReport({ dateFrom, dateTo, sponsor, driver });

  const header = [
    "Order ID",
    "Timestamp",
    "Driver Name",
    "Driver Email",
    "Sponsor",
    "Items",
    "Total Points",
    "Status",
  ].join(",");

  const rows = result.entries.map((e) => {
    const ts = new Date(e.timestamp).toLocaleString("en-US");
    return [
      `"${e.id}"`,
      `"${ts}"`,
      `"${(e.driverName ?? "").replace(/"/g, '""')}"`,
      `"${(e.driverEmail ?? "").replace(/"/g, '""')}"`,
      `"${e.sponsorName.replace(/"/g, '""')}"`,
      e.itemCount,
      e.totalPoints,
      `"${e.status}"`,
    ].join(",");
  });

  return [header, ...rows].join("\n");
}
