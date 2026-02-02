import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Only admins can access
  if (session?.user?.role !== "admin") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}