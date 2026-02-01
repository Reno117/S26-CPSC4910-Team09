// actions.ts
/*
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  const email = formData.get("email")?.toString()!;
  const role = formData.get("role")?.toString() as
    | "ADMIN"
    | "SPONSOR"
    | "DRIVER";

  if (!email || !role) throw new Error("Email and role are required");

  try {
    await prisma.user.create({
      data: { email, role },
    });
    revalidatePath("/posts");
  } catch (e) {
    console.error(e);
  }
}

*/