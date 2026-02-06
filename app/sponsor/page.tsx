import DriverHeader from "../components/SponsorComponents/SponsorHeader";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authClient } from "@/lib/auth-client";
import { requireSponsorUser } from "@/lib/auth-helpers";
import  SponsorToApps from "../components/SponsorComponents/Sponsor-toapps-button"
import ToMakeDrivers from "../components/SponsorComponents/Sponsor-tomakedriver"


export default async function SponsorDashboard() {

  const sponsorUser = await requireSponsorUser();
  const sponsorId = sponsorUser.sponsorUser!.sponsorId;
  const drivers = await prisma.driverProfile.findMany({
    where: {
      sponsorId: sponsorId,
      status: "active"
    },
    include: {
        user: true
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div>
     {/* <DriverHeader />*/} 
      <div> {/* Add padding to account for fixed header */}
        {/* Driver-specific content */}
        <div>
          <div className="w-full h-130 overflow-hidden">
            <img
              src="/semitruck.jpg"
              alt="Sponsor  Dashboard"
              className="w-full h-auto object-cover object-center"
            />
          </div>
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
        }} >
          {/*Drivers */}
          <h2 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>Registered Drivers</h2>
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
                  textAlign: 'center',
                  justifyContent: 'space-between'
                }}

              >
                <span style={{ fontSize: '16px', fontWeight: '500', color: '#000000', marginLeft: '20px' }}>
                {driver.user.name}
                </span>
                <button
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    alignItems: 'right'
                  }}
                //onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                //onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
                > Modify Points
                </button>
              </div>
            ))}
          </div>
          )}
          {/* Application and Audits buttons */}
        </div>
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
          //onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
          //onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
          > Audits
          </button>
          <SponsorToApps />
          {/*Make Driver button */}
          <ToMakeDrivers />
        </div>
      </div>

    </div>
  );
}
