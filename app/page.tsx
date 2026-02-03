"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const session = authClient.useSession();
  const isLoggedIn = !!session.data?.user;

  return (
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      {/* HERO */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* LEFT SIDE */}
          <div className="space-y-8">
            <h1 className="text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
              Let the Points <br />
              Roll In
            </h1>

            <p className="max-w-md text-sm text-black/70">
              Track and improve driver preformance, and reward your drivers <br />
              with customized catalog products changed on demand
            </p>
          </div>

          {/* RIGHT SIDE (image/video placeholder) */}
          <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <video
                src="/hero.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}