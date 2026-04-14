"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";


export function ImpersonateButton({ 
  targetUserId, 
  targetRole 
}: { 
  targetUserId: string;
  targetRole: "driver" | "sponsor" | "admin";
}) {
  const [loading, setLoading] = useState(false);

  async function handleImpersonate() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      // Redirect based on target role
      const redirectMap = {
        driver: "/driver",
        sponsor: "/sponsor",
        admin: "/admin",
      };
      
      window.location.href = redirectMap[targetRole];
    } catch (err) {
      console.error("Impersonation failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button 
      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition" 
      onClick={handleImpersonate} 
      disabled={loading}
    >
      {loading ? "Impersonating..." : "Impersonate User"}
    </button>
  );
}