import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function DriverLayout({
  children
}: {
  children: React.ReactNode
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Allow access if user is sponsor or admin
    if (session?.user?.role === "sponsor" || session?.user?.role === "admin") {
      return <>{children}</>;
    }

    // For drivers, check that they are active
    if (session?.user?.role === "driver") {
      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId: session.user.id },
      });

      // If pending, redirect to apply page
      if (driverProfile?.status === "pending") {
        redirect("/driver/apply");
      }

      // If active, allow access
      if (driverProfile?.status === "active") {
        return <>{children}</>;
      }

      // For any other status, redirect to apply page
      redirect("/driver/apply");
    }

    // No access
    redirect("/unauthorized");
  } catch (error) {
    // If database/auth fails, allow access for development
    console.warn('Auth check failed, allowing access for development:', error);
  }

  return <>{children}</>;
}