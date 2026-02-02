import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import LogoutButton from "./logout-button";

export default async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <nav className="bg-black text-white p-4 flex justify-between items-center sticky top-0">
      <div className="text-xl font-bold">
        <Link href="/">MySite</Link>
      </div>
      
      {session?.user ? (
        <div className="flex items-center space-x-4">
          <span className="text-sm">
            Logged in as: <strong>{session.user.name}</strong> | Role: <strong>{session.user.role}</strong>
          </span>
          <LogoutButton />
        </div>
      ) : (
        <div className="space-x-4">
          <Link
            href="/login"
            className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
}