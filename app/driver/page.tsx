import DriverHeader from "../components/DriverHeader";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export default async function DriverDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let pointsBalance = 0;

  // Temporarily disable database query to avoid connection issues
  /*
  try {
    if (session?.user?.id) {
      const driverProfile = await prisma().driverProfile.findUnique({
        where: { userId: session.user.id },
      });
      pointsBalance = driverProfile?.pointsBalance || 0;
    }
  } catch (error) {
    console.error('Database connection error:', error);
    // Fallback to 0 points if database is unavailable
    pointsBalance = 0;
  }
  */

  return (
    <div>
      <DriverHeader />
      <div className="pt-16"> {/* Add padding to account for fixed header */}
        {/* Driver-specific content */}
        <div>
          <div className="w-full h-130 overflow-hidden">
            <img
              src="/semitruck.jpg"
              alt="Driver Dashboard"
              className="w-full h-auto object-cover object-center"
            />
          </div>
        </div>

        {/* Points Display Box */}
        <div className="flex mt-8">
          {/* Left Box - Points */}
          <div className="w-1/2 p-10 bg-white rounded-lg border border-gray-200 mr-4">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">Driver Stats:</h2>
            <div className="text-5xl font-bold text-blue-600">
              Total Points: {pointsBalance.toLocaleString()}
            </div>
          </div>

          {/* Right Box - Placeholder for additional content */}
          <div className="w-1/2 p-10 bg-gray-50 rounded-lg border border-gray-200 ml-4">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">Point Transactions:</h2>
            <div className="text-lg text-gray-600">
              Recent point transfers will go here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}