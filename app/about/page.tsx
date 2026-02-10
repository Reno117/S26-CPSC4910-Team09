import DriverHeader from "../components/DriverHeader";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export default async function AboutPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">About information not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">
          {session.user?.name?? "About Us"}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Team Number</h2>
            <p className="text-3xl font-bold text-blue-600">#9</p>
          </div>

          <div className="bg-indigo-50 p-6 rounded-lg">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Version</h2>
            <p className="text-3xl font-bold text-indigo-600">{1}</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg md:col-span-2">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Release Date</h2>
            <p className="text-2xl font-bold text-purple-600">
              {new Date(session.user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Product Description</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {session.user.name}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          Last Updated: {new Date(session.user.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}