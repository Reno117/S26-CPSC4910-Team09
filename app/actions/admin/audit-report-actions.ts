"use server";
 
import { prisma } from "@/lib/prisma"; // adjust to your prisma client path
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
export type LogStatus = "success" | "warning" | "error" | "info";
 
export type AuditCategory =
  | "Password Change"
  | "Driver Status"
  | "Login Attempts"
  | "Point Change"
  | "In Depth Point Change";
 
export interface AuditEntry {
  id: string;
  timestamp: string;
  sponsor: string;
  category: AuditCategory;
  action: string;
  performedBy: string;
  status: LogStatus;
  details: string;
}
 
// ─── Actions ──────────────────────────────────────────────────────────────────
 
/**
 * Returns sponsor names for the filter dropdown.
 * Pulled from sponsor.name — not hardcoded.
 */
export async function getSponsors(): Promise<string[]> {
  const sponsors = await prisma.sponsor.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return sponsors.map((s) => s.name);
}
 
/**
 * Fetches audit log entries filtered by date range, sponsor, and categories.
 *
 * Sponsor filter resolution — audit logs track by userId, not sponsorId directly:
 *   1. Check sponsor_user WHERE userId = log.userId
 *      → sponsor_user.sponsorId → sponsor.name
 *   2. If not in sponsor_user, check driver_profile WHERE userId = log.userId
 *      → driver_profile.sponsorId → sponsor.name
 *   3. If the userId belongs to an admin, apply no sponsor filter
 *      (admins have no sponsor org and appear in all login attempt logs)
 */
export async function getAuditLogs({
  dateFrom,
  dateTo,
  sponsor,
  categories,
}: {
  dateFrom: string;
  dateTo: string;
  sponsor: string;
  categories: AuditCategory[];
}): Promise<AuditEntry[]> {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  to.setHours(23, 59, 59, 999);
 
  // Resolve sponsorId to filter by (null = no filter, i.e. "All Sponsors" or admin)
  let sponsorId: string | null = null;
  if (sponsor !== "All Sponsors") {
    const found = await prisma.sponsor.findFirst({
      where: { name: sponsor },
      select: { id: true },
    });
    sponsorId = found?.id ?? null;
  }
 
  const entries: AuditEntry[] = [];
 
  // ── Login Attempts → login_log ────────────────────────────────────────────
  if (categories.includes("Login Attempts")) {
    // Resolve which userIds belong to the selected sponsor
    let userIdFilter: string[] | undefined;
    if (sponsorId) {
      const sponsorUserIds = await prisma.sponsorUser.findMany({
        where: { sponsorId },
        select: { userId: true },
      });
      const driverUserIds = await prisma.driverProfile.findMany({
        where: { sponsorId },
        select: { userId: true },
      });
      // Admin userIds are NOT included when filtering by a specific sponsor
      userIdFilter = [
        ...sponsorUserIds.map((r) => r.userId),
        ...driverUserIds.map((r) => r.userId),
      ];
    }
 
    const logs = await prisma.loginLog.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        ...(userIdFilter ? { userId: { in: userIdFilter } } : {}),
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
 
    for (const log of logs) {
      // Resolve sponsor name for this log entry
      let sponsorName = "Admin";
      if (log.userId) {
        const su = await prisma.sponsorUser.findUnique({
          where: { userId: log.userId },
          select: { sponsor: { select: { name: true } } },
        });
        if (su) {
          sponsorName = su.sponsor.name;
        } else {
          const dp = await prisma.driverProfile.findUnique({
            where: { userId: log.userId },
            select: { sponsor: { select: { name: true } } },
          });
          sponsorName = dp?.sponsor?.name ?? "Admin";
        }
      }
 
      entries.push({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        sponsor: sponsorName,
        category: "Login Attempts",
        action: log.successful ? "Login successful" : "Login failed",
        performedBy: log.username,
        status: log.successful ? "success" : "error",
        details: log.successful
          ? `Successful login from IP ${log.ipAddress}.`
          : `Failed login from IP ${log.ipAddress}. Reason: ${log.failReason ?? "unknown"}.`,
      });
    }
  }
 
  // ── Password Change → password_change_log ────────────────────────────────
  if (categories.includes("Password Change")) {
    let userIdFilter: string[] | undefined;
    if (sponsorId) {
      const sponsorUserIds = await prisma.sponsorUser.findMany({
        where: { sponsorId },
        select: { userId: true },
      });
      const driverUserIds = await prisma.driverProfile.findMany({
        where: { sponsorId },
        select: { userId: true },
      });
      userIdFilter = [
        ...sponsorUserIds.map((r) => r.userId),
        ...driverUserIds.map((r) => r.userId),
      ];
    }
 
    const logs = await prisma.passwordChangeLog.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        ...(userIdFilter ? { userId: { in: userIdFilter } } : {}),
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
 
    for (const log of logs) {
      let sponsorName = "Admin";
      if (log.userId) {
        const su = await prisma.sponsorUser.findUnique({
          where: { userId: log.userId },
          select: { sponsor: { select: { name: true } } },
        });
        if (su) {
          sponsorName = su.sponsor.name;
        } else {
          const dp = await prisma.driverProfile.findUnique({
            where: { userId: log.userId },
            select: { sponsor: { select: { name: true } } },
          });
          sponsorName = dp?.sponsor?.name ?? "Admin";
        }
      }
 
      entries.push({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        sponsor: sponsorName,
        category: "Password Change",
        action: "Password changed",
        performedBy: log.user?.email ?? "unknown",
        status: "info",
        details: `Password changed from IP ${log.ipAddress}.`,
      });
    }
  }
 
  // ── Driver Status → driver_status_log ────────────────────────────────────
  if (categories.includes("Driver Status")) {
    const logs = await prisma.driverStatusLog.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        ...(sponsorId
          ? { driver: { sponsorId } }
          : {}),
      },
      include: {
        driver: {
          select: {
            user: { select: { email: true } },
            sponsor: { select: { name: true } },
          },
        },
        sponsorUser: { select: { user: { select: { email: true } } } },
        admin: { select: { user: { select: { email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
 
    for (const log of logs) {
      const performedBy =
        log.sponsorUser?.user.email ??
        log.admin?.user.email ??
        "system";
 
      entries.push({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        sponsor: log.driver.sponsor?.name ?? "Unknown",
        category: "Driver Status",
        action: `Driver ${log.newStatus}`,
        performedBy,
        status: log.newStatus === "dropped" ? "warning" : "success",
        details: [
          `Status changed: ${log.previousStatus ?? "N/A"} → ${log.newStatus}.`,
          log.changeReason ? `Reason: ${log.changeReason}.` : "",
        ]
          .filter(Boolean)
          .join(" "),
      });
    }
  }
 
  // ── Point Change → point_log ──────────────────────────────────────────────
  if (categories.includes("Point Change")) {
    const logs = await prisma.pointLog.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        ...(sponsorId ? { sponsorId } : {}),
      },
      include: {
        driver: { select: { user: { select: { email: true } } } },
        sponsor: { select: { name: true } },
        sponsorUser: { select: { user: { select: { email: true } } } },
        adminUser: { select: { user: { select: { email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
 
    for (const log of logs) {
      const performedBy =
        log.sponsorUser?.user.email ??
        log.adminUser?.user.email ??
        "system";
 
      entries.push({
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        sponsor: log.sponsor.name,
        category: "Point Change",
        action: `Points ${log.changeType.toLowerCase()}`,
        performedBy,
        status: log.changeType === "DEDUCT" || log.changeType === "PURCHASE" ? "warning" : "success",
        details: `${Math.abs(log.amountChange)} points ${log.changeType.toLowerCase()}ed for ${log.driver.user.email}. Balance: ${log.pointsBefore} → ${log.pointsAfter}. Reason: ${log.changeReason}.`,
      });
    }
  }
 
  // Sort all combined results by timestamp descending
  entries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
 
  return entries;
}