'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./logout-button";

export default function Navbar() {
  const pathname = usePathname();
  const isDriverPage = pathname.startsWith('/driver');

  if (isDriverPage) {
    return null;
  }

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center sticky top-0">
      <div className="text-xl font-bold">
        <Link href="/">MySite</Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-sm">
          {/* Assuming session is handled elsewhere, but since it's client, need to adjust */}
          Logged in as: <strong>User</strong> | Role: <strong>Role</strong>
        </span>
        <LogoutButton />
      </div>
    </nav>
  );
}