import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import DriverLists from "../components/SponsorComponents/driver-list";
import SponsorHeader from "../components/SponsorComponents/SponsorHeader"; 
import DriverListClient from "../components/SponsorComponents/DriverListClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function SponsorDashboard() {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = await prisma.user.findUnique({
      where: {id: session?.user?.id},
      select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
      },
  });
      
  // If admin, show all drivers; if sponsor, show only their drivers
  const drivers = await prisma.sponsoredBy.findMany({
    where: isAdmin
      ? { }
      : { sponsorOrgId: sponsorId!},
    select: {
      id: true,
      points: true,
      sponsorOrgId: true,
      createdAt: true,
      driver: {
        select: {
          id: true,
          status: true,
          pointsBalance: true, 
          user: {
            select: {
              name: true,
              email: true,
              image: true,
              id: true,
            },
          },
        },
      },
      sponsorOrg: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  if(!user)
  {
    return null;
  }
  return (
    <div>
      <SponsorHeader userSettings= {user}/>

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
            <DriverListClient drivers={drivers} isAdmin={isAdmin} initialCount={10} />
          )}
        </div>
      </div>
    </div>
  );
}