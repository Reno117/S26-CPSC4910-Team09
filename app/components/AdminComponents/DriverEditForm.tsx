"use client";

import { useState } from "react";

interface Sponsor {
  id: string;
  name: string;
}

interface Driver {
  id: string;
  userId: string;
  status: string;
  sponsorId: string | null;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}

interface DriverEditFormProps {
  driver: Driver;
  selectedSponsorIds: string[];
  sponsors: Sponsor[];
  updateAction: (formData: FormData) => Promise<void>;
}

export default function DriverEditForm({
  driver,
  selectedSponsorIds,
  sponsors,
  updateAction,
}: DriverEditFormProps) {
  const [status, setStatus] = useState(driver.status);

  return (
    <form action={updateAction} className="space-y-4">
      <input type="hidden" name="driverId" value={driver.id} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Driver ID
          </label>
          <input
            value={driver.id}
            disabled
            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            User ID
          </label>
          <input
            value={driver.userId}
            disabled
            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Name
        </label>
        <input
          name="name"
          defaultValue={driver.user.name}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Email
        </label>
        <input
          name="email"
          type="email"
          defaultValue={driver.user.email}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Image URL
        </label>
        <input
          name="image"
          defaultValue={driver.user.image ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Status
          </label>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="dropped">Dropped</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Sponsor Organizations
          {status === "pending" && (
            <span className="ml-2 text-xs text-gray-400 font-normal">
              (available after driver is activated)
            </span>
          )}
        </label>
        <select
          name="sponsorIds"
          defaultValue={selectedSponsorIds}
          multiple
          disabled={status === "pending"}
          className={`w-full rounded-md border px-3 py-2 text-sm outline-none min-h-36 ${
            status === "pending"
              ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
              : "border-gray-300 text-gray-900 focus:border-blue-400"
          }`}
        >
          {sponsors.map((sponsor) => (
            <option key={sponsor.id} value={sponsor.id}>
              {sponsor.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple sponsors.</p>
      </div>

      <button
        type="submit"
        className="inline-flex rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Save
      </button>
    </form>
  );
}
