"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import LogoutButton from "../components/logout-button";
import { useRouter } from "next/navigation";
import { handleDriverSignIn } from "@/app/actions/driver/handle-signin";
import { handleSponsorSignIn } from "@/app/actions/sponsor/handle-signin";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const session = authClient.useSession();
  const isLoggedIn = session.data?.user != null;
  const r = authClient.useSession();
  const userRole = r.data?.user?.role; 

  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    const redirectIfNeeded = async () => {
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
    setError(""); // Clear previous errors
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        // Show error message
        setError(result.error.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Success - redirect based on role
      setEmail("");
      setPassword("");
      
      // Check role and redirect accordingly
      const driverRedirect = await handleDriverSignIn();
      if (driverRedirect) {
        router.push(driverRedirect);
        return;
      }
      
      const sponsorRedirect = await handleSponsorSignIn();
      if (sponsorRedirect) {
        router.push(sponsorRedirect);
        return;
      }
      
      router.refresh();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

if (isLoggedIn) {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          You’re logged in!
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
        {/* Heading only – no icon */}
        <h1 className="text-3xl font-semibold text-slate-900">
          Welcome back!
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Log in using your email and password to get going.
        </p>

        {/* Card */}
        <div className="mt-6 w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border px-3 py-2 rounded w-64"
          />

          <div className="relative w-64">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border px-3 py-2 rounded w-full pr-20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

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

            <button
              onClick={onSignIn}
              disabled={loading}
              className="w-full rounded-md bg-[#003862] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#002a4a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <Link
                href="/forgot-password"
                className="text-sky-600 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}