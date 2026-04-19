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
    <div className="min-h-screen bg-[#e9eaeb] text-black">
      <SponsorHeader
        userSettings={{
          name: currentUser?.name ?? "",
          email: currentUser?.email ?? "",
          role: currentUser?.role ?? "",
          image: currentUser?.image ?? "",
        }}
      />

      <main className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        <div className="mb-8 space-y-1">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Rules
          </h1>
          <p className="text-sm text-black/70">
            Guidelines set by the admin for all sponsors and drivers.
          </p>
        </div>

        {rules.length === 0 ? (
          <p className="text-sm text-black/50">No rules have been published yet.</p>
        ) : (
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div
                key={rule.id}
                className="bg-white rounded-xl border border-black/10 shadow-sm p-5 space-y-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-black/40 bg-black/5 px-2 py-0.5 rounded">
                    {index + 1}
                  </span>
                  <h2 className="font-semibold">{rule.title}</h2>
                </div>
                <p className="text-sm text-black/60 whitespace-pre-wrap leading-relaxed">
                  {rule.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}