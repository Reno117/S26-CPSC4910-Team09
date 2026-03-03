import { getCurrentUser } from "@/lib/auth-helpers";
import CreateMassUsersAsSponsor from "@/app/components/AdminComponents/CreateMassUsersAsAdmin";
import SponsorHeader from "@/app/components/SponsorComponents/SponsorHeader";

export default async function CreateSponsorPage() {
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
        <div className="max-w-2xl mx-auto">
          {/* Page title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800 leading-tight">
              Bulk User Creation
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Upload a{" "}
              <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                .txt
              </code>{" "}
              file to create multiple drivers at once.
            </p>
          </div>

          {/* File format reference card */}
          <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-700">
                File Format Reference
              </h2>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Format string */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Expected Format
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-mono text-xs text-slate-600 tracking-tight">
                  type | orgName | first name | last name | email |{" "}
                  <span className="text-slate-400">points</span> |{" "}
                  <span className="text-slate-400">reason</span>
                </div>
              </div>

              {/* Type values */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Valid Types
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { code: "D", label: "Driver" },
                    { code: "S", label: "Sponsor" },
                  ].map(({ code, label }) => (
                    <div
                      key={code}
                      className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5"
                    >
                      <span className="font-mono text-sm font-bold text-blue-500">
                        {code}
                      </span>
                      <span className="text-xs text-slate-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Rules
                </p>
                <ul className="space-y-1.5">
                  {[
                    {
                      text: (
                        <>
                          Fields cannot contain the{" "}
                          <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-600">
                            |
                          </code>{" "}
                          delimiter
                        </>
                      ),
                    },
                    { text: "Points and reason fields are optional" },
                    { text: "If points is provided, reason must also be provided" },
                    { text: "Any type other than D or S is an error" },
                    { text: "No limit on file size" },
                  ].map(({ text }, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="mt-0.5">•</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Upload card */}
            <div className="p-6 sm:p-1 flex justify-center">
              <CreateMassUsersAsSponsor />
            </div>
        </div>
      </main>
    </div>
  );
}