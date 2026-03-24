import Link from "next/link";
import AdminHeader from "@/app/components/AdminComponents/AdminHeader";
const auditPages = [
  {
    title: "Driver Status Audit",
    description: "View audit history for driver status changes.",
    href: "/admin/audit/driver-status",
  },
  {
    title: "Login Audit",
    description: "Review user login attempts and sign-in activity.",
    href: "/admin/audit/login-audit",
  },
  {
    title: "Point Change Audit",
    description: "Track point adjustments and point-related updates.",
    href: "/admin/audit/point-change",
  },
  {
    title: "Password Change Audit",
    description: "Review password reset attempts and forgot-password submissions.",
    href: "/admin/audit/change-password-audit",
  },
];

export default function AuditHomePage() {
  return (
    <div>
        <AdminHeader />
    <main className="pt-24 px-6 min-h-screen flex flex-col items-center">
       
      <div className="mx-auto max-w-5xl">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Audit Center</h1>
          <p className="mt-2 text-gray-600">
            Navigate to the different audit logs below.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {auditPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {page.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">{page.description}</p>
              <div className="mt-4 text-sm font-medium text-blue-600">
                Open audit →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
    </div>
  );
}