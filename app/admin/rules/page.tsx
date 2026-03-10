import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import RulesClient from "@/app/components/AdminComponents/RulesClient";
import AdminHeader from "@/app/components/AdminComponents/AdminHeader";

export default async function AdminRulesPage() {
  await requireAdmin();

  const rules = await prisma.rule.findMany({
    orderBy: { id: "desc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <AdminHeader />
      <main className="px-4 pt-24 pb-10 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <RulesClient initialRules={rules} />
        </div>
      </main>
    </div>
  );
}