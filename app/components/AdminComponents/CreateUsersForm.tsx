"use client";

import { useMemo, useState } from "react";

type SponsorOption = {
  id: string;
  name: string;
};

interface CreateUsersFormProps {
  sponsors: SponsorOption[];
  action: (formData: FormData) => void | Promise<void>;
}

export default function CreateUsersForm({ sponsors, action }: CreateUsersFormProps) {
  const [userType, setUserType] = useState<"driver" | "sponsor" | "admin">("driver");

  const sponsorRequired = useMemo(() => userType === "sponsor", [userType]);

  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">User Type</label>
        <select
          name="userType"
          value={userType}
          onChange={(e) => setUserType(e.target.value as "driver" | "sponsor" | "admin")}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
        >
          <option value="driver">Driver</option>
          <option value="sponsor">Sponsor User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">Name</label>
        <input
          name="name"
          required
          placeholder="e.g. Jordan Smith"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          placeholder="e.g. jordan@example.com"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">Image URL</label>
        <input
          name="image"
          placeholder="https://..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
        />
      </div>

      <div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-800 mt-6">
          <input name="emailVerified" type="checkbox" className="rounded border-gray-300" />
          Email Verified
        </label>
      </div>

      {userType === "driver" && (
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Sponsor Organizations</label>
          <select
            name="sponsorIds"
            multiple
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none min-h-36 focus:border-blue-400"
          >
            {sponsors.map((sponsor) => (
              <option key={sponsor.id} value={sponsor.id}>
                {sponsor.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple sponsors.</p>
          {sponsors.length === 0 && (
            <p className="mt-1 text-xs text-red-600">Create a sponsor organization first.</p>
          )}
        </div>
      )}

      {userType === "sponsor" && (
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Sponsor Organization</label>
          <select
            name="sponsorId"
            required={sponsorRequired}
            defaultValue=""
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
          >
            <option value="" disabled>Select sponsor</option>
            {sponsors.map((sponsor) => (
              <option key={sponsor.id} value={sponsor.id}>
                {sponsor.name}
              </option>
            ))}
          </select>
          {sponsors.length === 0 && (
            <p className="mt-1 text-xs text-red-600">Create a sponsor organization first.</p>
          )}
        </div>
      )}

      {userType === "driver" && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Driver Status</label>
            <select
              name="driverStatus"
              defaultValue="active"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="dropped">Dropped</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Initial Points Balance</label>
            <input
              name="driverPointsBalance"
              type="number"
              defaultValue={0}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-800 mb-1">Address</label>
            <input
              name="driverAddress"
              placeholder="Optional address"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
            />
          </div>
        </>
      )}

      {userType === "sponsor" && (
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Sponsor User Status</label>
          <select
            name="sponsorUserStatus"
            defaultValue="active"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      )}

    {userType === "admin" && (
      <>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Admin Status</label>
          <select
            name="adminStatus"
            defaultValue="active"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="md:col-span-2 rounded-md border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Admin accounts have full platform access. No sponsor or driver profile will be created.
        </div>
      </>
    )}

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={sponsors.length === 0 && userType === "sponsor"}
          className="inline-flex rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          Create {userType === "driver" ? "Driver" : userType === "sponsor" ? "Sponsor User" : "Admin"}
        </button>
      </div>
    </form>
  );
}