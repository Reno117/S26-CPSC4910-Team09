"use client";

import { useState } from "react";
import { updatePoints } from "@/app/actions/sponsor/catalog/edit-pointconversion";

interface PointConversionProps {
  itemId: string | null;
  pointConversion: number | null;
}

export default function UpdatePointsModal({
  itemId,
  pointConversion,
}: PointConversionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pointValue, setPointValue] = useState(pointConversion ?? 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !pointValue) return;
    await updatePoints(itemId, pointValue);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={!itemId}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
      >
        Edit Points
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              Update Point Conversion
            </h2>
            <form onSubmit={handleSubmit}>
              <input
                type="number"
                value={pointValue}
                onChange={(e) => setPointValue(Number(e.target.value))}
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
