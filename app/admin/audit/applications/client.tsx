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
  }).format(new Date(date));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700 ring-1 ring-yellow-200">
          Pending
        </span>
      );
    case "ACCEPTED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
          Accepted
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
          Rejected
        </span>
      );
    default:
      return <span className="text-slate-600">{status}</span>;
  }
}

interface ApplicationLog {
  id: string;
  driverId: string;
  sponsorId: string;
  previousStatus: string | null;
  newStatus: string;
  createdAt: Date;
  driver: {
    user: { email: string };
  };
  sponsor: { name: string };
  sponsorUser?: {
    user: { email: string };
  } | null;
  admin?: {
    user: { email: string };
  } | null;
}

interface ApplicationAuditClientProps {
  logs: ApplicationLog[];
}

export default function ApplicationAuditClient({ logs }: ApplicationAuditClientProps) {
  const [searchEmail, setSearchEmail] = useState("");
  const [filtered, setFiltered] = useState<ApplicationLog[]>(logs);

  useEffect(() => {
    if (!searchEmail.trim()) {
      setFiltered(logs);
      return;
    }

    const lowerSearch = searchEmail.toLowerCase();
    setFiltered(
      logs.filter((log) =>
        log.driver.user.email.toLowerCase().includes(lowerSearch) ||
        log.sponsor.name.toLowerCase().includes(lowerSearch)
      )
    );
  }, [searchEmail, logs]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 pt-24 pb-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Application Audit Log</h1>
          <p className="mt-1 text-sm text-slate-500">Most recent {logs.length} driver applications</p>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by driver email or sponsor name..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Driver Email</th>
                <th className="px-4 py-3 font-medium text-slate-500">Sponsor</th>
                <th className="px-4 py-3 font-medium text-slate-500">Previous Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">New Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Changed By</th>
                <th className="px-4 py-3 font-medium text-slate-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700">{log.driver.user.email}</td>
                  <td className="px-4 py-3 text-slate-700">{log.sponsor.name}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {log.previousStatus ? (
                      getStatusBadge(log.previousStatus)
                    ) : (
                      <span className="text-slate-400 italic">New Application</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{getStatusBadge(log.newStatus)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {log.sponsorUser ? (
                      <span title={log.sponsorUser.user.email} className="text-blue-600">
                        {log.sponsorUser.user.email}
                      </span>
                    ) : log.admin ? (
                      <span title={log.admin.user.email} className="text-purple-600">
                        {log.admin.user.email} (Admin)
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Driver</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(log.createdAt)}</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    {searchEmail ? "No results found." : "No applications recorded yet."}
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
