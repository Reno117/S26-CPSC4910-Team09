"use client"


import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
 
interface DriverOption {
  driverId: string;
  driverName: string | null;
  driverEmail: string | null;
}
 
interface FilterBarProps {
  drivers: DriverOption[];
  currentDriver: string;
  currentReason: string;
}
 
export function FilterBar({ drivers, currentDriver, currentReason }: FilterBarProps) {
  const router     = useRouter();
  const pathname   = usePathname();
  const params     = useSearchParams();
  const [,startTransition] = useTransition();
 
  // Local state mirrors the URL so the inputs feel responsive immediately.
  const [driverVal, setDriverVal] = useState(currentDriver);
  const [reasonVal, setReasonVal] = useState(currentReason);
 
  // Debounce ref for the reason input to avoid a fetch on every keystroke.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 
  /** Push updated search params to the URL, preserving all existing params. */
  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      }
      startTransition(() => {
        router.push(`${pathname}?${next.toString()}`);
      });
    },
    [params, pathname, router],
  );
 
  function handleDriverChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setDriverVal(value);
    pushParams({ driver: value });
  }
 
  function handleReasonChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setReasonVal(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParams({ reason: value }), 400);
  }
 
  function handleClear() {
    setDriverVal("");
    setReasonVal("");
    pushParams({ driver: "", reason: "" });
  }
 
  const hasFilters = driverVal !== "" || reasonVal !== "";
 
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">
        Filter
      </span>
 
      {/* ── Driver dropdown ── */}
      <div className="relative">
        <select
          value={driverVal}
          onChange={handleDriverChange}
          className="appearance-none text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 cursor-pointer transition-colors hover:bg-slate-100"
        >
          <option value="">All drivers</option>
          {drivers.map((d) => (
            <option key={d.driverId} value={d.driverId}>
              {d.driverName ?? d.driverEmail ?? d.driverId}
            </option>
          ))}
        </select>
        {/* Chevron icon */}
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
 
      {/* ── Reason text input ── */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={reasonVal}
          onChange={handleReasonChange}
          placeholder="Search reasons…"
          className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-colors placeholder:text-slate-400"
        />
      </div>
 
      {/* ── Clear button — only visible when a filter is active ── */}
      {hasFilters && (
        <button
          onClick={handleClear}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}