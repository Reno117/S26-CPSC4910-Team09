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
    <div className="min-h-screen bg-[#e9eaeb] dark:bg-[#e9eaeb] text-black transition-colors duration-300">

      <AdminHeader />
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">

        <RulesClient initialRules={rules} />
      </main>
    </div>
  );
}