"use client";

import { useState } from "react";
import { toggleDriverStatus, toggleSponsorStatus, toggleAdminStatus } from "@/app/actions/admin/account-actions";
import { useRouter } from "next/navigation";

interface ToggleStatusButtonProps {
  profileId: string;
  currentStatus: string;
  userType: "driver" | "sponsor" | "admin";
}

export default function ToggleStatusButton({ profileId, currentStatus, userType }: ToggleStatusButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isDisabled = currentStatus === "disabled";

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (userType === "driver") {
        await toggleDriverStatus(profileId);
      } else if (userType == "sponsor") {
        await toggleSponsorStatus(profileId);
      } else {
        await toggleAdminStatus(profileId)
      }
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
        isDisabled
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-red-100 text-red-700 hover:bg-red-200"
      }`}
    >
      {loading ? "Updating..." : isDisabled ? "Enable Account" : "Disable Account"}
    </button>
  );
}