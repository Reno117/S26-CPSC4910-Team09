"use client";

import { useState } from "react";
import { reviewApplication } from "@/app/actions/sponsor/review-application";

interface ApplicationCardProps {
  application: {
    id: string;
    createdAt: Date;
    driverProfile: {
      user: {
        name: string;
        email: string;
      };
    };
  };
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    setError("");

    try {
      await reviewApplication(application.id, "approved");
      // Success - page will auto-refresh due to revalidatePath
    } catch (err: any) {
      setError(err.message || "Failed to approve application");
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await reviewApplication(application.id, "rejected", rejectReason);
      // Success - page will auto-refresh
    } catch (err: any) {
      setError(err.message || "Failed to reject application");
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">
            {application.driverProfile.user.name}
          </h3>
          <p className="text-gray-600">{application.driverProfile.user.email}</p>
          <p className="text-sm text-gray-400 mt-1">
            Applied: {new Date(application.createdAt).toLocaleDateString()}
            {/*Hydration working from this line */}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!showRejectForm ? (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Approve"}
          </button>
          
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition disabled:bg-gray-400"
          >
            Reject
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={3}
          />
          
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition disabled:bg-gray-400"
            >
              {loading ? "Rejecting..." : "Confirm Reject"}
            </button>
            
            <button
              onClick={() => {
                setShowRejectForm(false);
                setRejectReason("");
              }}
              disabled={loading}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
{/*
    

## **How It Works:**

1. **Server Component** (`applications/page.tsx`) fetches pending applications
2. **Client Component** (`ApplicationCard`) has the interactive buttons
3. **Approve button** → Calls `reviewApplication(id, "approved")`
4. **Reject button** → Shows textarea for reason, then calls `reviewApplication(id, "rejected", reason)`
5. **After action completes** → `revalidatePath()` in the action refreshes the page automatically

---

## **Flow:**
User clicks "Approve"
    ↓
reviewApplication() runs (server action)
    ↓
Updates DriverApplication status to "approved"
    ↓
Updates DriverProfile: sets sponsorId & status = "active"
    ↓
revalidatePath() triggers page refresh
    ↓
Application disappears from pending list (now approved)

```
*/}