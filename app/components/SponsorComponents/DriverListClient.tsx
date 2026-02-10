'use client';

import { useState, useRef, useEffect } from 'react';
import PointsButton from './points-button';
import { updateDriverProfile } from '@/app/actions/sponsor/edit-driver-as-sponsor';

type Driver = {
  id: string;
  pointsBalance: number;
  sponsorId: string | null;
  user: {
    name: string;
    email: string;
  };
  sponsor?: {
    name: string;
  } | null;
  // Add other profile fields you want to display
  createdAt: Date;
};

type DriverListClientProps = {
  drivers: Driver[];
  isAdmin: boolean;
};

type ContextMenuPosition = {
  x: number;
  y: number;
} | null;

export default function DriverListClient({ drivers, isAdmin }: DriverListClientProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Driver>>({});
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent, driver: Driver) => {
    e.preventDefault();
    setSelectedDriver(driver);
    setEditedData({
      user: { ...driver.user }
    });
    setIsEditMode(false);
    setIsSaving(false); // Reset saving state when opening modal
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setSelectedDriver(null);
    setIsEditMode(false);
    setEditedData({});
    setIsSaving(false); // Reset saving state when closing modal
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (selectedDriver) {
      setEditedData({
        user: { ...selectedDriver.user }
      });
    }
    setIsEditMode(false);
  };

  const handleSave = async () => {
    if (!selectedDriver) return;
    
    setIsSaving(true);
    try {
      await updateDriverProfile(selectedDriver.id, {
        name: editedData.user?.name,
        email: editedData.user?.email
      });

      // Success - reset state BEFORE closing
      setIsSaving(false);
      setIsEditMode(false);
      
      // Close modal after a brief delay to show success state
      setTimeout(() => {
        closeContextMenu();
      }, 300);
      
      // The page will automatically refresh due to revalidatePath in the server action
    } catch (error) {
      console.error('Error updating driver:', error);
      setIsSaving(false); // Reset on error
      alert(error instanceof Error ? error.message : 'Failed to update driver. Please try again.');
    }
  };

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeContextMenu();
      }
    };

    if (contextMenu) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [contextMenu]);

  return (
    <>
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
              <div 
                onContextMenu={(e) => handleContextMenu(e, driver)}
                style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#333',
                  cursor: 'context-menu',
                  display: 'inline-block'
                }}
              >
                {driver.user.name}
              </div>
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

      {/* Profile Modal */}
      {contextMenu && selectedDriver && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeContextMenu}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
              backdropFilter: 'blur(2px)'
            }}
          />
          
          {/* Modal */}
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              zIndex: 1000,
              width: '90%',
              maxWidth: '500px',
              padding: '0',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #eee',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px 12px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: '#333'
              }}>
                Driver Profile
              </h3>
              
              {/* Edit Icon */}
              <button
                onClick={handleEdit}
                disabled={isEditMode}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: isEditMode ? 'default' : 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                  opacity: isEditMode ? 0.5 : 1
                }}
                onMouseOver={(e) => !isEditMode && (e.currentTarget.style.backgroundColor = '#e9ecef')}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Edit driver"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#333" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>

            {/* Profile Information */}
            <div style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {!isEditMode ? (
                // View Mode
                <>
                  <ProfileItem label="Name" value={selectedDriver.user.name} />
                  <ProfileItem label="Email" value={selectedDriver.user.email} />
                  {selectedDriver.sponsor && (
                    <ProfileItem label="Sponsor" value={selectedDriver.sponsor.name} />
                  )}
                  <ProfileItem 
                    label="Member Since" 
                    value={new Date(selectedDriver.createdAt).toLocaleDateString()}
                  />
                </>
              ) : (
                // Edit Mode
                <>
                  <EditField
                    label="Name"
                    value={editedData.user?.name || ''}
                    onChange={(value) => setEditedData(prev => ({
                      ...prev,
                      user: { ...prev.user!, name: value }
                    }))}
                  />
                  <EditField
                    label="Email"
                    type="email"
                    value={editedData.user?.email || ''}
                    onChange={(value) => setEditedData(prev => ({
                      ...prev,
                      user: { ...prev.user!, email: value }
                    }))}
                  />
                  {selectedDriver.sponsor && (
                    <ProfileItem label="Sponsor" value={selectedDriver.sponsor.name} />
                  )}
                  
                  <ProfileItem 
                    label="Member Since" 
                    value={new Date(selectedDriver.createdAt).toLocaleDateString()}
                  />
                </>
              )}
            </div>

            {/* Footer with Close Button */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              {isEditMode ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: isSaving ? 0.6 : 1
                    }}
                    onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#5a6268')}
                    onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#6c757d')}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: isSaving ? 0.6 : 1
                    }}
                    onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#218838')}
                    onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#28a745')}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={closeContextMenu}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Helper component for profile items
function ProfileItem({ 
  label, 
  value, 
  valueStyle = {} 
}: { 
  label: string; 
  value: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span style={{
        fontSize: '14px',
        color: '#666',
        fontWeight: '500'
      }}>
        {label}:
      </span>
      <span style={{
        fontSize: '14px',
        color: '#333',
        ...valueStyle
      }}>
        {value}
      </span>
    </div>
  );
}

// Helper component for editable fields
function EditField({
  label,
  value,
  onChange,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
      <label style={{
        fontSize: '14px',
        color: '#666',
        fontWeight: '500'
      }}>
        {label}:
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '8px 12px',
          fontSize: '14px',
          color: '#111827',        
          backgroundColor: '#fff', 
          border: '1px solid #ddd',
          borderRadius: '4px',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
        onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
      />
    </div>
  );
}