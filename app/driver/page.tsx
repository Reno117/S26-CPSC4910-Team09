import DriverHeader from "../components/DriverHeader";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export default async function DriverDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let pointsBalance = 0;
  let pointHistory: any[] = [];

  try {
    if (session?.user?.id) {
      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId: session.user.id },
      });
      pointsBalance = driverProfile?.pointsBalance || 0;

      // Get point transaction history
      if (driverProfile) {
        pointHistory = await prisma.pointChange.findMany({
          where: {
            driverProfileId: driverProfile.id,
          },
          include: {
            changedByUser: true,
            sponsor: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Show last 10 transactions
        });
      }
    }
  } catch (error) {
    console.error('Database connection error:', error);
    pointsBalance = 0;
    pointHistory = [];
  }

  return (
    <div>
      <DriverHeader />
      <div className="pt-16">
        <div className="w-full h-130 overflow-hidden">
          <img
            src="/semitruck.jpg"
            alt="Driver Dashboard"
            className="w-full h-auto object-cover object-center"
          />
        </div>

        <div className="flex mt-8 gap-8 px-4">
          {/* Left Box - Points */}
          <div className="w-1/2 p-10 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">Driver Stats:</h2>
            <div className="text-5xl font-bold text-blue-600">
              {pointsBalance.toLocaleString()} points
            </div>
          </div>

          {/* Right Box - Point Transactions */}
          <div className="w-1/2 p-10 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">Point Transactions:</h2>
            
            {pointHistory.length === 0 ? (
              <p className="text-gray-500">No transactions yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pointHistory.map((change) => (
                  <div
                    key={change.id}
                    className="bg-white p-4 rounded border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-2xl font-bold ${
                          change.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {change.amount > 0 ? "+" : ""}{change.amount} points
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(change.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{change.reason}</p>
                    <p className="text-xs text-gray-400">
                      By: {change.changedByUser.name} ({change.sponsor.name})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}