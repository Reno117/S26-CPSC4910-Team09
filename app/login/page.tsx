"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const session = authClient.useSession();
  const isLoggedIn = session.data?.user != null;

  const onSignIn = async () => {
  setError(""); // clear old errors

  const result = await authClient.signIn.email({
    email,
    password,
    // no redirect, no extra props
  });

  if (result.error) {
    if (result.error.code === "PASSWORD_CHANGE_REQUIRED") {
      setError("You need to change your password before logging in.");
    } else {
      setError("Incorrect email or password.");
    }
  } else if (result.data.user) {
    console.log("Logged in as", result.data.user.name);
    // optionally redirect or update UI
  }
    setEmail("");
    setPassword("");
};

  return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      {!isLoggedIn ? (
        <>
          <h1 className="text-3xl font-bold">Login</h1>

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
            className="text-xl font-semibold px-6 py-2 border rounded hover:bg-blue-500 hover:text-white"
            onClick={onSignIn}
          >
            Login
          </button>
        </>
      ) : (
        <>
          <p className="text-xl">
            You are logged in as <strong>{session.data?.user?.name}</strong>
          </p>

          <button
            className="px-4 py-2 border rounded hover:bg-red-500 hover:text-white"
            onClick={() => authClient.signOut()}
          >
            Sign out
          </button>
        </>
      )}
    </div>
  );
}
