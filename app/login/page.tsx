"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import LogoutButton from "../components/logout-button";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const session = authClient.useSession();
  const isLoggedIn = session.data?.user != null;

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

      // Success - clear form and refresh
      setEmail("");
      setPassword("");
      setLoading(false); // Add this line
      router.refresh();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      {!isLoggedIn ? (
        <>
          <h1 className="text-3xl font-bold">Login</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-64 text-center">
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

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border px-3 py-2 rounded w-64"
          />

          <button
            className="text-xl font-semibold px-6 py-2 border rounded hover:bg-blue-500 hover:text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={onSignIn}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">You're logged in!</h1>
          <LogoutButton />
        </>
      )}
    </div>
  );
}