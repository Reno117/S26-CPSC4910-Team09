import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin, getCurrentUser } from "@/lib/auth-helpers";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";

export default async function SponsorRulesPage() {
  await requireSponsorOrAdmin();

  const rules = await prisma.rule.findMany({
    orderBy: { id: "asc" },
  });

  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <SponsorHeader
        userSettings={{
          name: currentUser?.name ?? "",
          email: currentUser?.email ?? "",
          role: currentUser?.role ?? "",
          image: currentUser?.image ?? "",
        }}
      />

      <main className="px-4 pt-24 pb-10 sm:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Rules</h1>
            <p className="text-sm text-gray-500 mt-1">
              Guidelines set by the admin for all sponsors and drivers.
            </p>
          </div>

          {rules.length === 0 ? (
            <p className="text-sm text-gray-400">
              No rules have been published yet.
            </p>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="border rounded p-5 space-y-2 bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {index + 1}
                    </span>
                    <h2 className="font-semibold">{rule.title}</h2>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {rule.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}