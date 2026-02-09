'use client';

import { useMemo, useState } from "react";
import PointsButton from "@/app/components/SponsorComponents/points-button";

interface DriverListProps {
  drivers: Array<{
    id: string;
    pointsBalance: number;
    sponsorId: string | null;
    user: {
      name: string;
      email: string;
    };
    sponsor: {
      name: string;
    } | null;
  }>;
  isAdmin: boolean;
  initialCount: number;
}

export default function DriverList({
  drivers,
  isAdmin,
  initialCount,
}: DriverListProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredDrivers = useMemo(() => {
    if (!normalizedQuery) return drivers;

    return drivers.filter((driver) => {
      const name = driver.user.name.toLowerCase();
      const email = driver.user.email.toLowerCase();
      return name.includes(normalizedQuery) || email.includes(normalizedQuery);
    });
  }, [drivers, normalizedQuery]);

  const visibleDrivers = normalizedQuery
    ? filteredDrivers
    : filteredDrivers.slice(0, initialCount);

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email"
          className="w-full px-3 py-2 border rounded"
        />
        {!normalizedQuery && drivers.length > initialCount && (
          <p className="text-sm text-gray-500 mt-2">
            Showing first {initialCount} of {drivers.length} drivers
          </p>
        )}
      </div>

      {visibleDrivers.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            color: "#666",
          }}
        >
          No matching drivers
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {visibleDrivers.map((driver) => (
            <div
              key={driver.id}
              style={{
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "6px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "#000000",
                    marginLeft: "20px",
                  }}
                >
                  {driver.user.name}
                </span>
                {isAdmin && driver.sponsor && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginLeft: "10px",
                    }}
                  >
                    ({driver.sponsor.name})
                  </span>
                )}
                <div
                  style={{
                    fontSize: "14px",
                    color: "#28a745",
                    fontWeight: "600",
                    marginLeft: "20px",
                    marginTop: "5px",
                  }}
                >
                  {driver.pointsBalance} points
                </div>
              </div>

              {driver.sponsorId && (
                <PointsButton
                  driverProfileId={driver.id}
                  driverName={driver.user.name}
                  sponsorId={driver.sponsorId}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
