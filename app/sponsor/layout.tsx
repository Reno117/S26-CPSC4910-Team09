import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function SponsorLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Allow access if user is sponsor OR admin
  const hasAccess = session?.user?.role === "sponsor" || session?.user?.role === "admin";

  if (!hasAccess) {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}