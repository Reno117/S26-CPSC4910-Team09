"use server";

import { getDriverStatus } from "@/lib/auth-helpers";

export async function handleDriverSignIn(): Promise<string | null> {
  const status = await getDriverStatus();
  
  if (status === "pending") {
    return "/driver/apply";
  } else if (status === "active") {
    return "/driver";
  }
  
  return null;
}
