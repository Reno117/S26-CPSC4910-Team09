import AdminHeader from "@/app/components/AdminComponents/AdminHeader";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import ApplicationAuditClient from "./client";

async function getApplicationAuditLog() {
  return prisma.applicationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      driver: {
        include: {
          user: true,
        },
      },
      sponsor: true,
      sponsorUser: {
        include: {
          user: true,
        },
      },
      admin: {
        include: {
          user: true,
        },
      },
    },
  });
}

export default async function ApplicationAuditPage() {
  await requireAdmin();
  const logs = await getApplicationAuditLog();

  return (
    <div>
      <AdminHeader />
      <ApplicationAuditClient logs={logs} />
    </div>
  );
}
