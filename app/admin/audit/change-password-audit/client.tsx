'use client';

import { useState, useEffect } from "react";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

interface PasswordResetAttempt {
  id: string;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  source: string;
  createdAt: Date;
}

interface ChangePasswordAuditClientProps {
  attempts: PasswordResetAttempt[];
}

export default function ChangePasswordAuditClient({ attempts }: ChangePasswordAuditClientProps) {
  const [searchEmail, setSearchEmail] = useState("");
  const [filtered, setFiltered] = useState<PasswordResetAttempt[]>(attempts);

  useEffect(() => {
    if (!searchEmail.trim()) {
      setFiltered(attempts);
      return;
    }

    const lowerSearch = searchEmail.toLowerCase();
    setFiltered(
      attempts.filter((attempt) =>
        attempt.email?.toLowerCase().includes(lowerSearch)
      )
    );
  }, [searchEmail, attempts]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 pt-24 pb-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Password Change Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500">Most recent {attempts.length} forgot-password attempts</p>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Email Entered</th>
                <th className="px-4 py-3 font-medium text-slate-500">IP Address</th>
                <th className="px-4 py-3 font-medium text-slate-500">User Agent</th>
                <th className="px-4 py-3 font-medium text-slate-500">Source</th>
                <th className="px-4 py-3 font-medium text-slate-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700">
                    {attempt.email ?? <span className="text-slate-400 italic">Not Provided</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {attempt.ipAddress ?? <span className="text-slate-400 italic">Unknown</span>}
                  </td>
                  <td className="max-w-[420px] truncate px-4 py-3 text-slate-700" title={attempt.userAgent ?? "Unknown"}>
                    {attempt.userAgent ?? <span className="text-slate-400 italic">Unknown</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{attempt.source}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(new Date(attempt.createdAt))}</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    {searchEmail ? "No results found." : "No forgot-password attempts recorded yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
