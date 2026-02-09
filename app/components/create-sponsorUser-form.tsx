"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSponsorUser } from "@/app/actions/sponsor/create-sponsor-user";

export default function CreateSponsorUserForm({
  sponsorId,
}: {
  sponsorId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createSponsorUser(sponsorId);
      setSuccess("Sponsor access granted!");
    } catch (err: any) {
      setError(err.message || "Failed to link sponsor account");
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

      {!success && (
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? "Linking..." : "Join Sponsor"}
          </button>
        </form>
      )}

      {success && (
        <button
          onClick={() => router.push("/sponsor")}
          className="mt-4 w-full bg-[#003862] text-white py-2 px-4 rounded hover:bg-[#002a4a] transition"
        >
          Go to Sponsor Dashboard
        </button>
      )}
    </div>
  );
}