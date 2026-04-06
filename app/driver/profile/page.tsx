"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useTransition } from "react";
import { getAlertPreferences } from "@/app/actions/alerts/get-alert-preferences";
import { updateAlertPreferences, AlertPreferencesInput } from "@/app/actions/alerts/update-alert-preferences";

export default function DriverProfilePage() {
  const session = authClient.useSession();
  const user = session.data?.user;
  const router = useRouter();

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    address: "",
  });
  const [initialForm, setInitialForm] = useState({
    name: "",
    email: "",
    address: "",
  });
  const [sponsorName, setSponsorName] = useState<string | null>(null);
  const [sponsorLoading, setSponsorLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      const nextForm = {
        name: user.name ?? "",
        email: user.email ?? "",
        address: (user as any)?.address ?? "",
      };
      setEditForm(nextForm);
      setInitialForm(nextForm);
    }
  }, [user]);

  const hasChanges =
    editForm.name !== initialForm.name ||
    editForm.email !== initialForm.email ||
    editForm.address !== initialForm.address;

  useEffect(() => {
    const fetchSponsor = async () => {
      setSponsorLoading(true);
      try {
        const res = await fetch("/api/user/driver/sponsor", {
          cache: "no-store",
        });
        const data = await res.json();
        setSponsorName(data?.sponsorName ?? null);
      } catch {
        setSponsorName(null);
      } finally {
        setSponsorLoading(false);
      }
    };
    fetchSponsor();
  }, []);

  const DEFAULT_PREFS: AlertPreferencesInput = {
    passwordChangeAlert: true,
    pointChangeAlert: true,
    adminChangeAlert: true,
    orderAlert: true,
    applicationAlert: true,
    statusAlert: true,
  };

  const ALERT_FIELDS: {
    key: keyof AlertPreferencesInput;
    label: string;
    description: string;
  }[] = [
    {
      key: "passwordChangeAlert",
      label: "Password Changes",
      description: "When your password is updated",
    },
    {
      key: "pointChangeAlert",
      label: "Point Changes",
      description: "When points are added or removed",
    },
    {
      key: "adminChangeAlert",
      label: "Admin Changes",
      description: "When an admin updates your profile",
    },
    {
      key: "orderAlert",
      label: "Orders",
      description: "When your order status changes",
    },
    {
      key: "applicationAlert",
      label: "Applications",
      description: "When your application is reviewed",
    },
    {
      key: "statusAlert",
      label: "Status Changes",
      description: "When your driver status changes",
    },
  ];

  const [prefs, setPrefs] = useState<AlertPreferencesInput>(DEFAULT_PREFS);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getAlertPreferences().then((p) => {
      if (p) setPrefs(p);
    });
  }, []);

  function handlePrefToggle(key: keyof AlertPreferencesInput) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handlePrefsSave() {
    startTransition(async () => {
      setPrefsSaving(true);
      const result = await updateAlertPreferences(prefs);
      setPrefsMsg(result.success ? "Preferences saved!" : "Failed to save.");
      setPrefsSaving(false);
      setTimeout(() => setPrefsMsg(""), 3000);
    });
  }

  const handleSave = async () => {
    if (!hasChanges) return;

    setSaving(true);
    try {
      await authClient.updateUser({ name: editForm.name });
      setInitialForm(editForm);
      setSaveMsg("Profile updated successfully!");
    } catch {
      setSaveMsg("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB.");
      return;
    }

    setAvatarUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await (authClient.updateUser as any)({ image: base64 });
      await session.refetch();
    } catch {
      alert("Failed to upload avatar.");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-400 hover:text-blue-500 flex items-center gap-1 text-sm"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative cursor-pointer group w-24 h-24 mb-3"
              onClick={() => fileInputRef.current?.click()}
              title="Click to change photo"
            >
              {(user as any)?.image ? (
                <img
                  src={(user as any).image}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-400"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-400 flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-300">
                  {(user?.name ?? "U").charAt(0).toUpperCase()}
                </div>
              )}

              <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading ? (
                  <span className="text-white text-sm">Uploading...</span>
                ) : (
                  <span className="text-white text-2xl">📷</span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <p className="text-xs text-gray-400">Click photo to change</p>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">
              {user?.name ?? "User"}
            </h1>
            <span className="text-sm text-gray-400 capitalize">
              {(user as any)?.role ?? "Driver"}
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                disabled
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Address
              </label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm({ ...editForm, address: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                placeholder="123 Main St"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Sponsor
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  (managed by sponsor)
                </span>
              </label>
              <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed">
                {sponsorLoading
                  ? "Loading..."
                  : (sponsorName ?? "No sponsor assigned")}
              </div>
            </div>
          </div>

          {saveMsg && (
            <p
              className={`mt-4 text-sm text-center ${saveMsg.includes("success") ? "text-green-500" : "text-red-500"}`}
            >
              {saveMsg}
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleLogout}
              className="flex-1 bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 transition text-sm"
            >
              Logout
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`flex-1 py-2.5 rounded-lg transition text-sm ${
                saving || !hasChanges
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-400 text-white hover:bg-blue-500"
              }`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
          {/* Alert Preferences */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h2 className="text-base font-semibold text-gray-700 mb-1">
              Alert Preferences
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Choose which notifications you want to receive.
            </p>

            <div className="space-y-4">
              {ALERT_FIELDS.map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400">{description}</p>
                  </div>
                  {/* Toggle switch — no shadcn dependency */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prefs[key]}
                    onClick={() => handlePrefToggle(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      prefs[key] ? "bg-blue-400" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        prefs[key] ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {prefsMsg && (
              <p
                className={`mt-3 text-sm text-center ${prefsMsg.includes("saved") ? "text-green-500" : "text-red-500"}`}
              >
                {prefsMsg}
              </p>
            )}

            <button
              onClick={handlePrefsSave}
              disabled={prefsSaving}
              className={`mt-4 w-full py-2.5 rounded-lg text-sm transition ${
                prefsSaving
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-400 text-white hover:bg-blue-500"
              }`}
            >
              {prefsSaving ? "Saving..." : "Save Alert Preferences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}