"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import LogoutButton from "../components/logout-button";
import Link from "next/link";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(""); // Add role state
  const [error, setError] = useState(""); // Add error state for feedback
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

const onSignup = async () => {
  // Validate role
  if (!role || role === "Select role") {
    setError("Please select a role");
    return;
  }

  setError("");

  try {
    const result = await authClient.signUp.email({
      email,
      password,
      name,
      role,
    });

    // If your auth client returns errors instead of throwing
    if (result?.error) {
      setError(result.error.message ?? "That email is already in use.");
      return;
    }

    // Success: clear inputs + refresh
    setEmail("");
    setPassword("");
    setName("");
    setRole("");
    router.refresh();
  } catch (e) {
    setError("That email is already in use.");
  }
};

  const r = authClient.useSession();
  const isLoggedIn = r.data?.user != null;
  const userRole = r.data?.user?.role; 

  if (isLoggedIn) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            You’re logged in!
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Logged in as{" "}
            <span className="font-medium text-slate-900">
              {r.data?.user?.name}
            </span>
          </p>

          {userRole === "sponsor" && (
            <button
              onClick={() => router.push("/sponsor/create-sponsor-user")}
              className="mt-6 w-full rounded-md bg-[#003862] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#002a4a]"
            >
              Join an Organization
            </button>
          )}

          {/* Optional: driver button if you want */}
          {userRole === "driver" && (
            <button
              onClick={() => router.push("/driver")}
              className="mt-6 w-full rounded-md bg-[#003862] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#002a4a]"
            >
              Continue to driver portal
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center">
        {/* Heading */}
        <h1 className="text-3xl font-semibold text-slate-900">
          Create your account
        </h1>

        {/* Card */}
        <div className="mt-6 w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

<div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
               </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 pr-12 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Select role</option>
                <option>sponsor</option>
                <option>driver</option>
                {/* KEEP THE SPONSOR AND DRIVER LOWERCASE IT WILL BREAK EVERYTHING IF NOT */}
              </select>
            </div>

            <button
              onClick={onSignup}
              className="w-full rounded-md bg-[#003862] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#002a4a]"
            >
              Create account
            </button>

            <div className="pt-1 text-xs text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="text-sky-600 hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}