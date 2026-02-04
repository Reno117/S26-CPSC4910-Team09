
"use client"
import React, { useState } from 'react';
import DriverHeader from "../components/SponsorHeader";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// Define the Driver type
interface Driver {
  id: number;
  name: string;
}
export default function SponsorDashboard() {
  // Sample driver data
  const drivers: Driver[] = [
    { id: 1, name: 'Driver1' },
    { id: 2, name: 'Driver2' },
    { id: 3, name: 'Driver3' },
    { id: 4, name: 'Driver4' },
  ];

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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {drivers.map((driver) => (
              <div
                key={driver.id}
                style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}

              >
                <span style={{ fontSize: '16px', fontWeight: '500', color: '#000000' }}>
                  {driver.name}
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
                    alignItems: 'right',
                    marginLeft: '550px'
                  }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
                > Modify Points
                </button>
              </div>
            ))}
          </div>
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
              fontWeight: '500'
            }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
          > Applications
          </button>
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
              marginLeft: '250px'
            }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
          > Audits
          </button>
        </div>
      </div>

    </div>
  );
}
