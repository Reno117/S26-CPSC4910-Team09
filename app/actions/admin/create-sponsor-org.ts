"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSponsorOrg(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect("/admin/create-sponsor-org?error=missing-name");
  }

  await prisma.sponsor.create({
    data: {
      name,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/create-sponsor-org");
  redirect("/admin/create-sponsor-org?saved=1");
}
