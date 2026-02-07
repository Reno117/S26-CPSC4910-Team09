import { prisma } from "@/lib/prisma";
import { requireSponsorOrAdmin } from "@/lib/auth-helpers";
import SponsorToApps from "../components/SponsorComponents/Sponsor-toapps-button";
import ToMakeDrivers from "../components/SponsorComponents/Sponsor-tomakedriver";
import PointsButton from "@/app/components/SponsorComponents/points-button";

export default async function SponsorDashboard() {
  const { isAdmin, sponsorId } = await requireSponsorOrAdmin();

  // If admin, show all drivers; if sponsor, show only their drivers
  const drivers = await prisma.driverProfile.findMany({
    where: isAdmin
      ? { status: "active" }
      : { sponsorId: sponsorId!, status: "active" },
    include: {
      user: true,
      sponsor: true, // Include sponsor info for admin view
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
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
          <h2 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: '500', 
                      color: '#000000',
                      marginLeft: '20px' 
                    }}>
                      {driver.user.name}
                    </span>
                    {isAdmin && driver.sponsor && (
                      <span style={{
                        fontSize: '12px',
                        color: '#666',
                        marginLeft: '10px'
                      }}>
                        ({driver.sponsor.name})
                      </span>
                    )}
                    <div style={{
                      fontSize: '14px',
                      color: '#28a745',
                      fontWeight: '600',
                      marginLeft: '20px',
                      marginTop: '5px'
                    }}>
                      {driver.pointsBalance} points
                    </div>
                  </div>

                  <PointsButton 
                    driverProfileId={driver.id} 
                    driverName={driver.user.name}
                    sponsorId={driver.sponsorId!}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '70px'
        }}>
          <button
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              width: '100px',
              height: '60px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              marginRight: '250px'
            }}
          >
            Audits
          </button>
          <SponsorToApps />
          <ToMakeDrivers />
        </div>
      </div>
    </div>
  );
}