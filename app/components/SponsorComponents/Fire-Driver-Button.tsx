'use client'

import { useState } from 'react';
import { fireDriver } from "@/app/actions/sponsor/fire-driver";

interface FireDriverProps {
  driver: {
    id: string;
    sponsorOrgId: string | null;
    points: number;
    driver: {
      id: string;
      user: {
        name: string;
      };
    };
  };
}

export default function FireDriverButton({ driver }: FireDriverProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isFiring, setIsFiring] = useState(false);

  async function handleConfirm() {
    setIsFiring(true);
    await fireDriver(driver.driver.id);
    setIsFiring(false);
    setShowConfirm(false);
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        style={{
          backgroundColor: '#f70000',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Fire Driver
      </button>

      {showConfirm && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowConfirm(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999
            }}
          />

          {/* Dialog */}
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white', borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 1000, width: '90%', maxWidth: '400px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#333' }}>
              Fire {driver.driver.user.name}?
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#666' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isFiring}
                style={{
                  backgroundColor: '#6c757d', color: 'white', border: 'none',
                  padding: '8px 16px', borderRadius: '6px',
                  cursor: isFiring ? 'not-allowed' : 'pointer',
                  opacity: isFiring ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isFiring}
                style={{
                  backgroundColor: '#f70000', color: 'white', border: 'none',
                  padding: '8px 16px', borderRadius: '6px',
                  cursor: isFiring ? 'not-allowed' : 'pointer',
                  opacity: isFiring ? 0.6 : 1
                }}
              >
                {isFiring ? 'Firing...' : 'Yes, Fire'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}