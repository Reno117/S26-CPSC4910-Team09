"use client";

import { useState } from "react";
import { addPoints } from "@/app/actions/sponsor/manage-points";

interface PointsButtonProps {
  driverProfileId: string;
  driverName: string;
  sponsorId: string; // Add this line
}

export default function PointsButton({
  driverProfileId,
  driverName,
  sponsorId,
}: PointsButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || !reason.trim()) {
      setError("Please fill in all fields");
      return;
    }

    const pointAmount = parseInt(amount);
    if (isNaN(pointAmount) || pointAmount === 0) {
      setError("Please enter a valid point amount");
      return;
    }

    setLoading(true);

    try {
      await addPoints(driverProfileId, pointAmount, reason);
      setShowModal(false);
      setAmount("");
      setReason("");
    } catch (err: any) {
      setError(err.message || "Failed to update points");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
      >
        Manage Points
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              Manage Points for {driverName}
            </h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Points Amount (use negative for deductions)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 100 or -50"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason (required)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Safe driving bonus, Late delivery penalty"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {loading ? "Processing..." : "Submit"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setAmount("");
                    setReason("");
                    setError("");
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
