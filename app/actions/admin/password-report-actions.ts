"use server";
 
import { prisma } from "@/lib/prisma";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
export interface PasswordResetEntry {
  id: string;
  timestamp: string;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  source: string;
}
 
export interface PasswordResetEmailSummary {
  email: string;
  totalAttempts: number;
  firstAttempt: string;
  lastAttempt: string;
  uniqueIps: number;
  ipAddresses: string[];
  sources: string[];
  flaggedActivity: boolean;
  flagReason: string | null;
}
 
export interface PasswordResetDayBucket {
  date: string;
  count: number;
}
 
export interface PasswordResetAuditResult {
  entries: PasswordResetEntry[];
  emailSummaries: PasswordResetEmailSummary[];
  dailyTrend: PasswordResetDayBucket[];
  topIps: { ip: string; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
  metrics: {
    total: number;
    uniqueEmails: number;
    uniqueIps: number;
    flaggedEmails: number;
    avgAttemptsPerEmail: number;
  };
}
 
// ─── Constants ────────────────────────────────────────────────────────────────
 
/** Emails with more than this many attempts in the period are flagged. */
const HIGH_FREQUENCY_THRESHOLD = 3;
 
/** Emails with attempts from more than this many distinct IPs are flagged. */
const MULTI_IP_THRESHOLD = 2;
 
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
 
// ─── Action ───────────────────────────────────────────────────────────────────
 
export async function getPasswordResetReport({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}): Promise<PasswordResetAuditResult> {
  const { from, to } = parseDateRange(dateFrom, dateTo);
 
  const raw = await prisma.passwordResetAttempt.findMany({
    where: {
      createdAt: { gte: from, lte: to },
    },
    orderBy: { createdAt: "desc" },
  });
 
  // ── Entries ──────────────────────────────────────────────────────────────
  const entries: PasswordResetEntry[] = raw.map((r) => ({
    id: r.id,
    timestamp: r.createdAt.toISOString(),
    email: r.email ?? null,
    ipAddress: r.ipAddress ?? null,
    userAgent: r.userAgent ?? null,
    source: r.source,
  }));
 
  // ── Per-email summaries ──────────────────────────────────────────────────
  const emailMap = new Map<
    string,
    {
      email: string;
      timestamps: string[];
      ips: Set<string>;
      sources: Set<string>;
    }
  >();
 
  for (const e of entries) {
    const key = e.email ?? "unknown";
    if (!emailMap.has(key)) {
      emailMap.set(key, { email: key, timestamps: [], ips: new Set(), sources: new Set() });
    }
    const u = emailMap.get(key)!;
    u.timestamps.push(e.timestamp);
    if (e.ipAddress) u.ips.add(e.ipAddress);
    u.sources.add(e.source);
  }
 
  const emailSummaries: PasswordResetEmailSummary[] = [];
  for (const u of emailMap.values()) {
    const sorted = [...u.timestamps].sort();
    const totalAttempts = u.timestamps.length;
    const uniqueIps = u.ips.size;
 
    let flaggedActivity = false;
    let flagReason: string | null = null;
 
    if (totalAttempts > HIGH_FREQUENCY_THRESHOLD) {
      flaggedActivity = true;
      flagReason = `${totalAttempts} attempts in period (threshold: ${HIGH_FREQUENCY_THRESHOLD})`;
    } else if (uniqueIps > MULTI_IP_THRESHOLD) {
      flaggedActivity = true;
      flagReason = `Attempted from ${uniqueIps} distinct IP addresses`;
    }
 
    emailSummaries.push({
      email: u.email,
      totalAttempts,
      firstAttempt: sorted[0] ?? "",
      lastAttempt: sorted[sorted.length - 1] ?? "",
      uniqueIps,
      ipAddresses: Array.from(u.ips),
      sources: Array.from(u.sources),
      flaggedActivity,
      flagReason,
    });
  }
 
  emailSummaries.sort((a, b) => {
    if (a.flaggedActivity !== b.flaggedActivity) return a.flaggedActivity ? -1 : 1;
    return b.totalAttempts - a.totalAttempts;
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
 
  const dailyTrend: PasswordResetDayBucket[] = Array.from(dayMap.entries()).map(
    ([date, count]) => ({ date, count })
  );
 
  // ── Top IPs ──────────────────────────────────────────────────────────────
  const ipCountMap = new Map<string, number>();
  for (const e of entries) {
    if (e.ipAddress) {
      ipCountMap.set(e.ipAddress, (ipCountMap.get(e.ipAddress) ?? 0) + 1);
    }
  }
  const topIps = Array.from(ipCountMap.entries())
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
 
  // ── Source breakdown ─────────────────────────────────────────────────────
  const sourceCountMap = new Map<string, number>();
  for (const e of entries) {
    sourceCountMap.set(e.source, (sourceCountMap.get(e.source) ?? 0) + 1);
  }
  const sourceBreakdown = Array.from(sourceCountMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
 
  // ── Top-level metrics ────────────────────────────────────────────────────
  const total = entries.length;
  const uniqueEmails = emailMap.size;
  const uniqueIps = new Set(entries.map((e) => e.ipAddress).filter(Boolean)).size;
  const flaggedEmails = emailSummaries.filter((u) => u.flaggedActivity).length;
 
  return {
    entries,
    emailSummaries,
    dailyTrend,
    topIps,
    sourceBreakdown,
    metrics: {
      total,
      uniqueEmails,
      uniqueIps,
      flaggedEmails,
      avgAttemptsPerEmail: uniqueEmails > 0 ? Math.round((total / uniqueEmails) * 10) / 10 : 0,
    },
  };
}
 
// ─── CSV Export ───────────────────────────────────────────────────────────────
 
export async function exportPasswordResetCSV({
  dateFrom,
  dateTo,
}: {
  dateFrom: string;
  dateTo: string;
}): Promise<string> {
  const result = await getPasswordResetReport({ dateFrom, dateTo });
 
  const header = ["ID", "Timestamp", "Email", "IP Address", "Source", "User Agent"].join(",");
 
  const rows = result.entries.map((e) => {
    const ts = new Date(e.timestamp).toLocaleString("en-US");
    return [
      e.id,
      `"${ts}"`,
      `"${e.email ?? ""}"`,
      `"${e.ipAddress ?? ""}"`,
      `"${e.source}"`,
      `"${(e.userAgent ?? "").replace(/"/g, "'")}"`,
    ].join(",");
  });
 
  return [header, ...rows].join("\n");
}