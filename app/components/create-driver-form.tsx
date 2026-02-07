"use client";

import { useState } from "react";
import { createDriverManually } from "@/app/actions/sponsor/create-driver";

interface CreateDriverFormProps {
  isAdmin: boolean;
  sponsorId?: string | null; // For sponsors, this is pre-filled
  sponsors?: Array<{ id: string; name: string }>; // For admins, they choose
}

export default function CreateDriverForm({ 
  isAdmin, 
  sponsorId, 
  sponsors 
}: CreateDriverFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedSponsorId, setSelectedSponsorId] = useState(sponsorId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedSponsorId) {
      setError("Please select a sponsor");
      return;
    }

    setLoading(true);

    try {
      const result = await createDriverManually({
        name,
        email,
        password,
        sponsorId: selectedSponsorId,
      });

      if (result.success) {
        setSuccess(`Driver created successfully!`);
        setName("");
        setEmail("");
        setPassword("");
        if (isAdmin) setSelectedSponsorId("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create driver");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
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
        {/* Admin: Show sponsor selector */}
        {isAdmin && sponsors && (
          <div>
            <label className="block text-sm font-medium mb-1">Sponsor Organization</label>
            <select
              value={selectedSponsorId}
              onChange={(e) => setSelectedSponsorId(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Sponsor --</option>
              {sponsors.map((sponsor) => (
                <option key={sponsor.id} value={sponsor.id}>
                  {sponsor.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Driver Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? "Creating..." : "Create Driver"}
        </button>
      </form>
    </div>
  );
}