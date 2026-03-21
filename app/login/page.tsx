"use client";
 
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import LogoutButton from "../components/logout-button";
import { useRouter } from "next/navigation";
import { handleAdminSignIn } from "@/app/actions/admin/handle-signin";
import { handleDriverSignIn } from "@/app/actions/driver/handle-signin";
import { handleSponsorSignIn } from "@/app/actions/sponsor/handle-signin";
import { logFailedSignIn } from "@/lib/loginfailed";
import { logPassedSignIn } from "@/lib/loginpassed";
import Link from "next/link";
 
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [deactivatedModal, setDeactivatedModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
 
  const session = authClient.useSession();
  const isLoggedIn = session.data?.user != null;
  const userRole = session.data?.user?.role;
 
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      try {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
        localStorage.removeItem("rememberMe");
      } catch (error) {
        console.error("Error clearing credentials:", error);
      }
    }
  };
 
  // Load saved credentials on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedEmail = localStorage.getItem("rememberedEmail");
      const savedPassword = localStorage.getItem("rememberedPassword");
      const savedRememberMe = localStorage.getItem("rememberMe");
      if (savedRememberMe === "true" && savedEmail && savedPassword) {
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.error("Error loading saved credentials:", error);
    }
  }, []);
 
  // Fires when isLoggedIn flips to true — logs success + redirects
  useEffect(() => {
    if (!isLoggedIn) return;
 
    let cancelled = false;
 
    const redirectIfNeeded = async () => {
      await logPassedSignIn();
 
      const adminRedirect = await handleAdminSignIn();
      if (!cancelled && adminRedirect) {
        router.push(adminRedirect);
        return;
      }
 
      const driverRedirect = await handleDriverSignIn();
      if (!cancelled && driverRedirect) {
        router.push(driverRedirect);
        return;
      }
 
      const sponsorRedirect = await handleSponsorSignIn();
      if (!cancelled && sponsorRedirect) {
        router.push(sponsorRedirect);
      }
    };
 
    redirectIfNeeded();
 
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, router]);
 
  const onSignIn = async () => {
    setError("");
    setDeactivatedModal(false);
    setLoading(true);
 
    try {
      const result = await authClient.signIn.email({ email, password });
 
      if (result?.error) {
        const errorMsg = result.error.message || "Invalid email or password";
        await logFailedSignIn(email);
        if (errorMsg.includes("dropped")) {
          setDeactivatedModal(true);
          setLoading(false);
          return;
        }
        setError(errorMsg);
        setLoading(false);
        return;
      }
 
      // Handle Remember Me
      if (rememberMe) {
        try {
          localStorage.setItem("rememberedEmail", email);
          localStorage.setItem("rememberedPassword", password);
          localStorage.setItem("rememberMe", "true");
        } catch (error) {
          console.error("Error saving credentials:", error);
        }
      } else {
        try {
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberedPassword");
          localStorage.removeItem("rememberMe");
        } catch (error) {
          console.error("Error removing credentials:", error);
        }
      }
 
      // Redirect + logging handled by the useEffect above
 
    } catch (err) {
      await logFailedSignIn(email);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };
 
  if (isLoggedIn) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            You're logged in!
          </h1>
          {userRole === "sponsor" && (
            <button
              onClick={() => router.push("/sponsor")}
              className="mt-6 w-full rounded-md bg-[#003862] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#002a4a]"
            >
              Sponsor Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-slate-50 px-4">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center">
        <h1 className="text-3xl font-semibold text-slate-900">Welcome back!</h1>
        <p className="mt-2 text-base text-slate-600">
          Log in using your email and password to get going.
        </p>
 
        <div className="mt-6 w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
 
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400"
            />
 
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 pr-16 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
 
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => handleRememberMeChange(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#003862] focus:ring-[#003862]"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-sm text-slate-700 cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>
 
            <button
              onClick={onSignIn}
              disabled={loading}
              className="w-full rounded-md bg-[#003862] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#002a4a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
 
            <div className="flex items-center justify-between pt-1 text-xs">
              <Link href="/forgot-password" className="text-sky-600 hover:underline">
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>
      </div>
 
      {deactivatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-8 shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M4.22 4.22a10 10 0 1 1 14.14 14.14A10 10 0 0 1 4.22 4.22z" />
              </svg>
            </div>
            <h3 className="mt-4 text-center text-lg font-semibold text-slate-900">
              Account Deactivated
            </h3>
            <p className="mt-2 text-center text-sm text-slate-600">
              Your account has been deactivated and you cannot sign in at this time. If you believe this is an error, please contact support.
            </p>
            <button
              onClick={() => setDeactivatedModal(false)}
              className="mt-6 w-full rounded-md bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}