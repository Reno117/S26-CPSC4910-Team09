"use server";

import { getCurrentUser } from "@/lib/auth-helpers";

export async function handleAdminSignIn(): Promise<string | null> {
  const user = await getCurrentUser();

  if (user?.role === "admin") {
    return "/admin";
  }
  

  return null;
}
