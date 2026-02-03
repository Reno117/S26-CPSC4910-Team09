import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DriverLayout({
  children
}: {
  children: React.ReactNode
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Allow access if user is driver, sponsor, OR admin
    const hasAccess =
      session?.user?.role === "driver" ||
      session?.user?.role === "sponsor" ||
      session?.user?.role === "admin";

    if (!hasAccess) {
      redirect("/unauthorized");
    }
  } catch (error) {
    // If database/auth fails, allow access for development
    console.warn('Auth check failed, allowing access for development:', error);
  }

  return <>{children}</>;
}