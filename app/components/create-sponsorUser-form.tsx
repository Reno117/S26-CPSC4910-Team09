"use client";

import { useState } from "react";
import { createSponsorUser } from "@/app/actions/sponsor/create-sponsor-user";

export default function CreateSponsorUserForm({
  sponsorId,
}: {
  sponsorId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await createSponsorUser(formData);
      setSuccess("Sponsor user created successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to create sponsor user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-md">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-black/80 mb-1">Name</label>
          <input
            name="name"
            required
            placeholder="e.g. Jordan Smith"
            className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm text-black outline-none focus:border-[#0d2b45]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black/80 mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="e.g. jordan@example.com"
            className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm text-black outline-none focus:border-[#0d2b45]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black/80 mb-1">Image URL</label>
          <input
            name="image"
            placeholder="https://..."
            className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm text-black outline-none focus:border-[#0d2b45]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black/80 mb-1">Status</label>
          <select
            name="sponsorUserStatus"
            defaultValue="active"
            className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm text-black outline-none focus:border-[#0d2b45]"
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 text-sm text-black/80">
            <input name="emailVerified" type="checkbox" className="rounded border-black/20" />
            Email Verified
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0d2b45] text-white py-2 px-4 rounded-lg hover:opacity-80 transition disabled:bg-gray-400 text-sm font-semibold"
        >
          {loading ? "Creating..." : "Create Sponsor User"}
        </button>
      </form>
    </div>
  );
}