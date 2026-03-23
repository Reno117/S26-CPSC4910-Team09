import AdminHeader from "../components/AdminComponents/AdminHeader";
import ActiveUsersList from "../components/AdminComponents/ActiveUsersList";
import { prisma } from "@/lib/prisma";

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
      admin: {
        select: {
          userId: true,
          status: true,
        }
      }
    },
    orderBy: {
      name: "asc",
    },
  });

  const driverSponsorRows = await prisma.$queryRaw<{
    driverId: string;
    sponsorName: string;
  }[]>`
    SELECT
      sb.driverId,
      s.name AS sponsorName
    FROM sponsored_by sb
    INNER JOIN sponsor s ON s.id = sb.sponsorOrgId
    ORDER BY s.name ASC
  `;

  const sponsorsByDriverId = new Map<string, string[]>();
  for (const row of driverSponsorRows) {
    const existing = sponsorsByDriverId.get(row.driverId) ?? [];
    existing.push(row.sponsorName);
    sponsorsByDriverId.set(row.driverId, existing);
  }

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
    driverSponsorOrganizations: user.driverProfile?.id
      ? sponsorsByDriverId.get(user.driverProfile.id) ?? []
      : [],
    adminId: user.admin?.userId ?? null,
    adminStatus: user.admin?.status ?? null,
  }));

  return (
    <div>
      <AdminHeader />

      <main className="pt-24 px-6 min-h-screen flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Admin Dashboard
        </h1>
        <ActiveUsersList users={formattedUsers} />
      </main>
    </div>
  );
}
