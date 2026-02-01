"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const onSignup = async () => {
    await authClient.signUp.email({
      email,
      password,
      name,
    });

    setEmail("");
    setPassword("");
    setName("");
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

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />

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
          <button
            className="hover:bg-red-500"
            onClick={() => {
              authClient.signOut();
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }
}
