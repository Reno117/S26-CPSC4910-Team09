'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./logout-button";
import { authClient } from "@/lib/auth-client";

export default function Navbar() {
  const pathname = usePathname();
  const isDriverPage = pathname.startsWith("/driver");

  const session = authClient.useSession();
  const user = session.data?.user;

  if (isDriverPage) return null;

  return (
    <nav className="bg-[#003862] text-white p-4 flex justify-between items-center sticky top-0">
      <div className="text-lg font-light tracking-[0.18em] uppercase">
        <Link href="/">TIGER TRUCK TRANSIT</Link>
      </div>

      {session.isPending ? (
        <div className="text-sm opacity-80">Loading…</div>
      ) : user ? (
        <div className="flex items-center space-x-4">
          <span className="text-sm">
            Logged in as: <strong>{user.name ?? "User"}</strong> | Role:{" "}
            <strong>{(user as any).role ?? "User"}</strong>
          </span>
          <LogoutButton />
        </div>
      ) : (
        <div className="space-x-4">
          <Link
            href="/login"
            className="px-6 py-2 rounded-full border border-white text-white hover:bg-white/10 transition-colors duration-200"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="px-6 py-2 rounded-full bg-white text-[#003862] hover:bg-white/90 transition-colors duration-200"
          >
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
}