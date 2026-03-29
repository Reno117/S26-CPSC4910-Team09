"use server";
 
import { prisma } from "@/lib/prisma";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
export interface SignInEntry {
  id: number;
  timestamp: string;
  success: boolean;
  userName: string | null;
  userEmail: string | null;
  userId: string | null;
}
 
export interface SignInUserSummary {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  total: number;
  successes: number;
  failures: number;
  successRate: number;
  /** ISO timestamp of last attempt */
  lastAttempt: string;
  /** true if the user's most recent N attempts are all failures */
  suspiciousStreak: boolean;
  streakLength: number;
}
 
export interface SignInDayBucket {
  date: string; // "MMM D" formatted
  successes: number;
  failures: number;
}
 
export interface SignInAuditResult {
  entries: SignInEntry[];
  userSummaries: SignInUserSummary[];
  dailyTrend: SignInDayBucket[];
  metrics: {
    total: number;
    successes: number;
    failures: number;
    successRate: number;
    uniqueUsers: number;
    suspiciousUsers: number;
  };
}
 
// ─── Constants ────────────────────────────────────────────────────────────────
 
const STREAK_THRESHOLD = 3;
 
// ─── Action ───────────────────────────────────────────────────────────────────
 
export async function getSignInAuditReport({
  dateFrom,
  dateTo,
  sponsor,
}: {
  dateFrom: string;
  dateTo: string;
  sponsor: string;
}): Promise<SignInAuditResult> {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  to.setHours(23, 59, 59, 999);
 
  // Resolve userIds to filter by sponsor
  let userIdFilter: string[] | undefined;
  if (sponsor !== "All Sponsors") {
    const found = await prisma.sponsor.findFirst({
      where: { name: sponsor },
      select: { id: true },
    });
    if (found) {
      const [sponsorUserIds, driverUserIds] = await Promise.all([
        prisma.sponsorUser.findMany({
          where: { sponsorId: found.id },
          select: { userId: true },
        }),
        prisma.driverProfile.findMany({
          where: { sponsorId: found.id },
          select: { userId: true },
        }),
      ]);
      userIdFilter = [
        ...sponsorUserIds.map((r) => r.userId),
        ...driverUserIds.map((r) => r.userId),
      ];
    }
  }
 
  const raw = await prisma.signInAttempt.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      ...(userIdFilter ? { userId: { in: userIdFilter } } : {}),
    },
    include: {
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
 
  // ── Entries ──────────────────────────────────────────────────────────────
  const entries: SignInEntry[] = raw.map((r) => ({
    id: r.id,
    timestamp: r.createdAt.toISOString(),
    success: r.success,
    userName: r.user?.name ?? null,
    userEmail: r.user?.email ?? null,
    userId: r.userId ?? null,
  }));
 
  // ── Per-user summaries ───────────────────────────────────────────────────
  const userMap = new Map<
    string,
    {
      userId: string | null;
      userName: string | null;
      userEmail: string | null;
      attempts: { success: boolean; ts: string }[];
    }
  >();
 
  for (const e of entries) {
    const key = e.userId ?? `anon-${e.userEmail ?? "unknown"}`;
    if (!userMap.has(key)) {
      userMap.set(key, {
        userId: e.userId,
        userName: e.userName,
        userEmail: e.userEmail,
        attempts: [],
      });
    }
    userMap.get(key)!.attempts.push({ success: e.success, ts: e.timestamp });
  }
 
  const userSummaries: SignInUserSummary[] = [];
  for (const u of userMap.values()) {
    // attempts are already newest-first from the query
    const total = u.attempts.length;
    const successes = u.attempts.filter((a) => a.success).length;
    const failures = total - successes;
 
    // Streak: count leading failures (newest-first)
    let streakLength = 0;
    for (const a of u.attempts) {
      if (!a.success) streakLength++;
      else break;
    }
 
    userSummaries.push({
      userId: u.userId,
      userName: u.userName,
      userEmail: u.userEmail,
      total,
      successes,
      failures,
      successRate: total > 0 ? Math.round((successes / total) * 100) : 0,
      lastAttempt: u.attempts[0]?.ts ?? "",
      suspiciousStreak: streakLength >= STREAK_THRESHOLD,
      streakLength,
    });
  }
 
  // Sort: suspicious first, then by total desc
  userSummaries.sort((a, b) => {
    if (a.suspiciousStreak !== b.suspiciousStreak)
      return a.suspiciousStreak ? -1 : 1;
    return b.total - a.total;
  });
 
  // ── Daily trend ──────────────────────────────────────────────────────────
  const dayMap = new Map<string, { successes: number; failures: number }>();
 
  // Pre-fill every day in range so the chart has no gaps
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key = cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dayMap.set(key, { successes: 0, failures: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
 
  for (const e of entries) {
    const key = new Date(e.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const bucket = dayMap.get(key);
    if (bucket) {
      if (e.success) bucket.successes++;
      else bucket.failures++;
    }
  }
 
  const dailyTrend: SignInDayBucket[] = Array.from(dayMap.entries()).map(
    ([date, v]) => ({ date, ...v })
  );
 
  // ── Top-level metrics ────────────────────────────────────────────────────
  const total = entries.length;
  const successes = entries.filter((e) => e.success).length;
  const failures = total - successes;
 
  return {
    entries,
    userSummaries,
    dailyTrend,
    metrics: {
      total,
      successes,
      failures,
      successRate: total > 0 ? Math.round((successes / total) * 100) : 0,
      uniqueUsers: userMap.size,
      suspiciousUsers: userSummaries.filter((u) => u.suspiciousStreak).length,
    },
  };
}

export async function exportSignInAuditCSV({
  dateFrom,
  dateTo,
  sponsor,
}: {
  dateFrom: string;
  dateTo: string;
  sponsor: string;
}): Promise<string> {
  const result = await getSignInAuditReport({ dateFrom, dateTo, sponsor });

  const header = ["ID", "Timestamp", "Name", "Email", "Result"].join(",");

  const rows = result.entries.map((e) => {
    const ts = new Date(e.timestamp).toLocaleString("en-US");
    const result = e.success ? "Success" : "Failed";
    return [
      e.id,
      `"${ts}"`,
      `"${e.userName ?? ""}"`,
      `"${e.userEmail ?? ""}"`,
      result,
    ].join(",");
  });

  return [header, ...rows].join("\n");
}