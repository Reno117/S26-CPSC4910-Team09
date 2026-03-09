"use client";

import { useEffect, useRef, useState } from "react";
import { getDriverSponsors, type DriverSponsor } from "@/app/actions/driver/get-driver-sponsors"

interface SponsorDropdownProps {
  driverId: string | null;
  defaultSponsorId?: string | null;
  onSponsorChange?: (sponsorId: string) => void;
}

export default function SponsorDropdown({
  driverId,
  defaultSponsorId,
  onSponsorChange,
}: SponsorDropdownProps) {
  const [sponsors, setSponsors] = useState<DriverSponsor[]>([]);
  const [selectedId, setSelectedId] = useState<string>(defaultSponsorId ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch sponsors on mount
  useEffect(() => {
    async function fetchSponsors() {
      if (!driverId)
        return;
        try {
        setIsLoading(true);
        const data = await getDriverSponsors(driverId);
        setSponsors(data);
        // If no default is set but there are sponsors, do not auto-select
      } catch (err) {
        setError("Failed to load sponsors.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSponsors();
  }, [driverId]);

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedSponsor = sponsors.find((s) => s.id === selectedId);

  function handleSelect(sponsor: DriverSponsor) {
    setSelectedId(sponsor.id);
    onSponsorChange?.(sponsor.id);
    setIsOpen(false);
  }

  return (
    <div className="relative w-full max-w-sm font-sans" ref={dropdownRef}>
      {/* Label */}
      <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
        Sponsor
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !isLoading && setIsOpen((prev) => !prev)}
        disabled={isLoading || !!error}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={[
          "w-full flex items-center justify-between gap-3",
          "px-4 py-3 rounded-xl border text-sm font-medium",
          "transition-all duration-150 outline-none",
          isLoading || error
            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-white border-slate-200 text-slate-800 shadow-sm cursor-pointer",
          "hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
        ].join(" ")}
      >
        <span className="flex items-center gap-2.5 truncate">
          {isLoading ? (
            <>
              <SpinnerIcon />
              <span className="text-slate-400">Loading sponsors…</span>
            </>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : selectedSponsor ? (
            <>
              <SponsorBadge name={selectedSponsor.name} />
              <span className="truncate">{selectedSponsor.name}</span>
            </>
          ) : (
            <span className="text-slate-400">Select a sponsor…</span>
          )}
        </span>
        {!isLoading && !error && <ChevronIcon open={isOpen} />}
      </button>

      {/* Dropdown list */}
      {isOpen && sponsors.length > 0 && (
        <ul
          role="listbox"
          aria-label="Sponsors"
          className={[
            "absolute z-50 mt-2 w-full",
            "bg-white border border-slate-200 rounded-xl shadow-lg",
            "max-h-64 overflow-y-auto",
            "animate-in fade-in slide-in-from-top-1 duration-100",
            "divide-y divide-slate-100",
          ].join(" ")}
        >
          {sponsors.map((sponsor) => (
            <li
              key={sponsor.id}
              role="option"
              aria-selected={sponsor.id === selectedId}
              onClick={() => handleSelect(sponsor)}
              className={[
                "flex items-center justify-between gap-3 px-4 py-3",
                "text-sm cursor-pointer transition-colors duration-100",
                sponsor.id === selectedId
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              <span className="flex items-center gap-2.5">
                <SponsorBadge name={sponsor.name} active={sponsor.id === selectedId} />
                <span className="font-medium">{sponsor.name}</span>
              </span>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {sponsor.points.toLocaleString()} pts
              </span>
            </li>
          ))}
        </ul>
      )}

      {isOpen && sponsors.length === 0 && !isLoading && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm text-slate-400">
          No sponsors found for this driver.
        </div>
      )}

      {/* Hidden input to store sponsor id for form use */}
      <input type="hidden" name="sponsorId" value={selectedId} />

      {/* Selected ID display (optional — remove in production) */}
      {selectedId && (
        <p className="mt-2 text-xs text-slate-400">
          Selected ID: <span className="font-mono text-slate-500">{selectedId}</span>
        </p>
      )}
    </div>
  );
  // ─── Sub-components ────────────────────────────────────────────────────────────

function SponsorBadge({ name, active }: { name: string; active?: boolean }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={[
        "inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0",
        active
          ? "bg-indigo-200 text-indigo-700"
          : "bg-slate-100 text-slate-600",
      ].join(" ")}
    >
      {initials}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-slate-400 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-slate-400 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
}