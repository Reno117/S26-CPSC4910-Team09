
import { getMyAlerts, markAlertRead, markAllAlertsRead } from "@/app/actions/admin/alert-get-new";

function formatAlertType(alertType: string) {
  switch (alertType) {
    case "PASSWORD_CHANGE":
      return "Password Change";
    case "POINT_CHANGE":
      return "Point Change";
    case "ADMIN_CHANGE":
      return "Admin Change";
    case "ORDER":
      return "Order";
    case "APPLICATION":
      return "Application";
    case "STATUS":
      return "Status";
    default:
      return alertType;
  }
}

export default async function AlertsPage() {
  const alerts = await getMyAlerts();
  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#003862]">My Alerts</h1>
            <p className="mt-1 text-sm text-gray-600">
              You have <span className="font-semibold">{unreadCount}</span> unread alert
              {unreadCount === 1 ? "" : "s"}.
            </p>
          </div>

          {unreadCount > 0 && (
            <form action={markAllAlertsRead}>
              <button
                type="submit"
                className="rounded-full bg-[#003862] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Mark All Read
              </button>
            </form>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">No alerts yet</h2>
            <p className="mt-2 text-sm text-gray-500">
              When something important happens, it’ll show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                  alert.isRead
                    ? "border-gray-200 opacity-80"
                    : "border-[#003862]/20 ring-1 ring-[#003862]/10"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#003862]/10 px-3 py-1 text-xs font-semibold text-[#003862]">
                        {formatAlertType(alert.alertType)}
                      </span>

                      {!alert.isRead && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          Unread
                        </span>
                      )}
                    </div>

                    <p className="text-base text-gray-800">{alert.alertContent}</p>

                    <p className="mt-3 text-sm text-gray-500">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {!alert.isRead && (
                    <form action={markAlertRead.bind(null, alert.id)}>
                      <button
                        type="submit"
                        className="rounded-full border border-[#003862] px-4 py-2 text-sm font-medium text-[#003862] transition hover:bg-[#003862] hover:text-white"
                      >
                        Mark Read
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}