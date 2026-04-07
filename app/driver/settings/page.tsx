"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DriverHeader from "@/app/components/DriverComponents/DriverHeader";

type AlertToggles = {
  adminChangeAlert: boolean;
  pointChangeAlert: boolean;
  applicationAlert: boolean;
  orderAlert: boolean;
  passwordChangeAlert: boolean;
  statusAlert: boolean;
};

const DEFAULT_TOGGLES: AlertToggles = {
  adminChangeAlert: true,
  pointChangeAlert: true,
  applicationAlert: true,
  orderAlert: true,
  passwordChangeAlert: true,
  statusAlert: true,
};

export default function DriverSettingsPage() {
  const router = useRouter();
  const [togglesLoaded, setTogglesLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [toggles, setToggles] = useState<AlertToggles>(DEFAULT_TOGGLES);
  const [initialToggles, setInitialToggles] = useState<AlertToggles>(DEFAULT_TOGGLES);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch("/api/alert-preferences");
        const data = await res.json();

        const prefs: AlertToggles = {
          adminChangeAlert: data?.adminChangeAlert ?? true,
          pointChangeAlert: data?.pointChangeAlert ?? true,
          applicationAlert: data?.applicationAlert ?? true,
          orderAlert: data?.orderAlert ?? true,
          passwordChangeAlert: data?.passwordChangeAlert ?? true,
          statusAlert: data?.statusAlert ?? true,
        };

        setToggles(prefs);
        setInitialToggles(prefs);
      } finally {
        setTogglesLoaded(true);
      }
    };

    fetchPreferences();
  }, []);

  const hasChanges = JSON.stringify(toggles) !== JSON.stringify(initialToggles);

  const handleToggle = (key: keyof AlertToggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setSaving(true);
    setSaveMsg("");
    try {
      await fetch("/api/alert-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toggles),
      });

      setInitialToggles(toggles);
      setSaveMsg("Settings updated successfully!");
    } catch {
      setSaveMsg("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverHeader />
      <div className="pt-20 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 text-blue-400 hover:text-blue-500 flex items-center gap-1 text-sm"
          >
            ← Back
          </button>

          <div className="bg-white rounded-2xl shadow-md p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Notification Settings</h1>
            <p className="text-sm text-gray-500 mb-6">Choose which alerts you want to receive.</p>

            {!togglesLoaded ? (
              <p className="text-center text-gray-400">Loading preferences...</p>
            ) : (
              <div className="space-y-4">
                {[
                  { key: "pointChangeAlert", label: "Point Change Alerts", desc: "Receive alerts when points change" },
                  { key: "applicationAlert", label: "Application Status Alerts", desc: "Receive updates when applications are accepted or rejected" },
                  { key: "orderAlert", label: "Order Alerts", desc: "Receive updates when orders are placed or updated" },
                  { key: "passwordChangeAlert", label: "Password Change Alerts", desc: "Receive alerts when your password is changed" },
                  { key: "statusAlert", label: "Status Alerts", desc: "Receive alerts when your account status changes" },
                  { key: "adminChangeAlert", label: "Admin Change Alerts", desc: "Receive alerts when an admin makes changes to your account" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(key as keyof AlertToggles)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        toggles[key as keyof AlertToggles] ? "bg-blue-400" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          toggles[key as keyof AlertToggles] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {saveMsg && (
              <p className={`mt-4 text-sm ${saveMsg.includes("success") ? "text-green-500" : "text-red-500"}`}>
                {saveMsg}
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className={`px-5 py-2.5 rounded-lg text-sm transition ${
                  saving || !hasChanges
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-400 text-white hover:bg-blue-500"
                }`}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
