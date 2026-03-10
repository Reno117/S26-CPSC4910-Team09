"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function createRule(data: {
  title: string;
  content: string;
}) {
  await requireAdmin();

  if (!data.title?.trim()) throw new Error("Title is required");
  if (!data.content?.trim()) throw new Error("Content is required");

  const rule = await prisma.rule.create({
    data: {
      title: data.title.trim(),
      content: data.content.trim(),
    },
  });

  revalidatePath("/admin/rules");
  return { success: true, ruleId: rule.id };
}

export async function updateRule(data: {
  id: number;
  title: string;
  content: string;
}) {
  await requireAdmin();

  if (!data.title?.trim()) throw new Error("Title is required");
  if (!data.content?.trim()) throw new Error("Content is required");

  const existing = await prisma.rule.findUnique({ where: { id: data.id } });
  if (!existing) throw new Error("Rule not found");

  const rule = await prisma.rule.update({
    where: { id: data.id },
    data: {
      title: data.title.trim(),
      content: data.content.trim(),
    },
  });

  revalidatePath("/admin/rules");
  return { success: true, ruleId: rule.id };
}

export async function deleteRule(id: number) {
  await requireAdmin();

  const existing = await prisma.rule.findUnique({ where: { id } });
  if (!existing) throw new Error("Rule not found");

  await prisma.rule.delete({ where: { id } });

  revalidatePath("/admin/rules");
  return { success: true };
}