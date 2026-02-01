import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center sticky top-0">
      <div className="text-xl font-bold">
        <Link href="/">MySite</Link>
      </div>
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
    </nav>
  );
}