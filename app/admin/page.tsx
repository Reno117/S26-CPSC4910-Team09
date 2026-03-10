import AdminHeader from "../components/AdminComponents/AdminHeader";
import ActiveUsersList from "../components/AdminComponents/ActiveUsersList";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: { not: "driver" } },
        {
          role: "driver",
          driverProfile: {
            isNot: null,
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      sponsorUser: {
        select: {
          id: true,
          status: true,
          sponsorId: true,
          sponsor: {
            select: {
              name: true,
            },
          },
        },
      },
      driverProfile: {
        select: {
          id: true,
          pointsBalance: true,
          status: true,
          sponsor: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const formattedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    sponsorId: user.sponsorUser?.sponsorId ?? null,
    sponsorOrganization: user.sponsorUser?.sponsor?.name ?? null,
    sponsorUserId: user.sponsorUser?.id ?? null,
    sponsorUserStatus: user.sponsorUser?.status ?? null,
    driverId: user.driverProfile?.id ?? null,
    driverPointsBalance: user.driverProfile?.pointsBalance ?? null,
    driverStatus: user.driverProfile?.status ?? null,
    driverSponsorOrganization: user.driverProfile?.sponsor?.name ?? null,
  }));

  return (
    <div>
      <AdminHeader />

      <main className="pt-24 px-6 min-h-screen flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Admin Dashboard
        </h1>
        <div className="w-full max-w-6xl mb-4 flex justify-end">
          <Link
            href="/admin/create-sponsor-org"
            className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create Sponsor Organization
          </Link>
        </div>
        <ActiveUsersList users={formattedUsers} />
      </main>
    </div>
  );
}
