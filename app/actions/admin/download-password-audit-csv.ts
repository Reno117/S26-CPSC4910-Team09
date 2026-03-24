"use server";

import { prisma } from "@/lib/prisma";

interface PasswordResetAttempt {
  id: string;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  source: string;
  createdAt: Date;
}

export async function downloadPasswordAuditCsv(attempts: PasswordResetAttempt[]) {
  try {
    // Create CSV headers
    const headers = [
      "Email Entered",
      "IP Address",
      "User Agent",
      "Source",
      "Time",
    ];

    // Create CSV rows
    const rows = attempts.map((attempt) => [
      attempt.email ? `"${attempt.email.replace(/"/g, '""')}"` : "",
      attempt.ipAddress ? `"${attempt.ipAddress.replace(/"/g, '""')}"` : "",
      attempt.userAgent
        ? `"${attempt.userAgent.replace(/"/g, '""')}"`
        : "",
      `"${attempt.source.replace(/"/g, '""')}"`,
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date(attempt.createdAt)),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Return CSV as blob data
    return {
      success: true,
      data: csvContent,
      filename: `password-audit-${new Date().toISOString().split("T")[0]}.csv`,
    };
  } catch (error) {
    console.error("Error generating CSV:", error);
    return { success: false, error: "Failed to generate CSV" };
  }
}
