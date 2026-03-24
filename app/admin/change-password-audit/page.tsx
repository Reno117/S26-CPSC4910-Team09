import AdminHeader from "@/app/components/AdminComponents/AdminHeader";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import ChangePasswordAuditClient from "./client";

async function getForgotPasswordAuditLog() {
  return prisma.passwordResetAttempt.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export default async function ChangePasswordAuditPage() {
  await requireAdmin();
  const attempts = await getForgotPasswordAuditLog();

  return (
    <div>
      <AdminHeader />
      <ChangePasswordAuditClient attempts={attempts} />
    </div>
  );
}
