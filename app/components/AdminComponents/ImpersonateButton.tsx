"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function ImpersonateButton({ targetUserId }: { targetUserId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
/*
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

      const { token } = await res.json();

      // Store the original session so you can restore it later
      const currentToken = localStorage.getItem("token");
      if (currentToken) {
        localStorage.setItem("pre_impersonation_token", currentToken);
      }

      localStorage.setItem("token", token);
      router.push("/dashboard");
    } catch (err) {
      console.error("Impersonation failed:", err);
    } finally {
      setLoading(false);
    }
  }
*/
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

    // Refresh the session so authClient picks up the new session
    window.location.href = "/driver";
} catch (err) {
    console.error("Impersonation failed:", err);
  } finally {
    setLoading(false);
  }
}
  return (
    <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition" onClick={handleImpersonate} disabled={loading}>
      {loading ? "Impersonating..." : "Impersonate User"}
    </button>
  ); 
}