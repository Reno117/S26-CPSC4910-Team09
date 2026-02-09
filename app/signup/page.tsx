"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import LogoutButton from "../components/logout-button";
import { handleDriverSignIn } from "@/app/actions/driver/handle-signin";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState(""); // Add role state
  const [error, setError] = useState(""); // Add error state for feedback
  const router = useRouter();

  const onSignup = async () => {
    // Validate that role is selected
    if (!role) {
      setError("Please select a role");
      return;
    }

    // Clear any previous errors
    setError("");

    await authClient.signUp.email({
      email,
      password,
      name,
      role,
    });

    setEmail("");
    setPassword("");
    setName("");
    setRole("");
    
    // Redirect based on role
    if (role === "driver") {
      const redirectUrl = await handleDriverSignIn();
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    } else {
      router.refresh();
    }
  };

  const r = authClient.useSession();
  const isLoggedIn = r.data?.user != null;
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <h1 className="text-3xl font-bold">Sign Up</h1>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />

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

        {error && <p style={{ color: "red" }}>{error}</p>}

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option>Select role</option>
          <option>sponsor</option>
          <option>driver</option>
          {/* KEEP THE SPONSOR AND DRIVER LOWERCASE IT WILL BREAK EVERYTHING IF NOT   */}
        </select>

        <button
          onClick={onSignup}
          className="text-xl font-semibold px-6 py-2 border rounded hover:bg-blue-500 hover:text-white"
        >
          Sign Up
        </button>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <h1 className="text-3xl font-bold">
          You are logged in as {r.data?.user?.name}
        </h1>
        <div>
          <LogoutButton />
        </div>
      </div>
    );
  }
}
