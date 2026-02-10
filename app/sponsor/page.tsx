import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import DriverList from "@/app/components/SponsorComponents/driver-list";
import SponsorHeader from "../components/SponsorComponents/SponsorHeader"; // Adjust the path as necessary

export default async function SponsorDashboard() {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();

  // If admin, show all drivers; if sponsor, show only their drivers
  const drivers = await prisma.driverProfile.findMany({
    where: isAdmin
      ? { status: "active" }
      : { sponsorId: sponsorId!, status: "active" },
    select: {
      id: true,
      pointsBalance: true,
      sponsorId: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      sponsor: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      <SponsorHeader />

      <div>
        <div className="w-full h-130 overflow-hidden">
          <img
            src="/semitruck.jpg"
            alt="Sponsor Dashboard"
            className="w-full h-auto object-cover object-center"
          />
        </div>
      </div>

      <div style={{
        padding: '100px',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div style={{
          maxWidth: '900px',
          width: '100%',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          padding: '20px',
          justifyContent: 'center'
        }}>
          {/* Header */}
          <h2 style={{ marginTop: 0, color: '#333', textAlign: 'center', fontSize: '35px'}}>
            {isAdmin ? "All Registered Drivers" : "Registered Drivers"}
          </h2>

          {drivers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#666'
            }}>
              No registered drivers
            </div>
          ) : (
            <DriverListClient drivers={drivers} isAdmin={isAdmin} />
          )}
        </div>
      </div>
    </div>
  );
}