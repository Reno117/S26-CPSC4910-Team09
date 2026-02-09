"use server";

import { getCurrentUser } from "@/lib/auth-helpers";

export async function handleSponsorSignIn(): Promise<string | null> {
  const user = await getCurrentUser();
  
  if (user?.role === "sponsor") {
    return "/sponsor";
  }
  
  return null;
}
