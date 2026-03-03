"use client";

import { useState } from "react";

interface Sponsor {
  id: string;
  name: string;
}

interface SponsorUser {
  id: string;
  userId: string;
  sponsorId: string;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  sponsor: {
    name: string;
  };
}

interface SponsorEditFormProps {
  sponsorUser: SponsorUser;
  sponsors: Sponsor[];
  updateAction: (formData: FormData) => Promise<void>;
}

export default function SponsorEditForm({
  sponsorUser,
  sponsors,
  updateAction,
}: SponsorEditFormProps) {
  return (
    <form action={updateAction} className="space-y-4">
      <input type="hidden" name="sponsorUserId" value={sponsorUser.id} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Sponsor User ID
          </label>
          <input
            value={sponsorUser.id}
            disabled
            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            User ID
          </label>
          <input
            value={sponsorUser.userId}
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
          defaultValue={sponsorUser.user.name}
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
          defaultValue={sponsorUser.user.email}
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
          defaultValue={sponsorUser.user.image ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Sponsor Organization
        </label>
        <select
          name="sponsorId"
          defaultValue={sponsorUser.sponsorId}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400"
        >
          <option value="">Select a sponsor</option>
          {sponsors.map((sponsor) => (
            <option key={sponsor.id} value={sponsor.id}>
              {sponsor.name}
            </option>
          ))}
        </select>
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
