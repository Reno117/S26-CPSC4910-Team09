'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import PointsButton from './points-button';
import { updateDriverProfile } from '@/app/actions/sponsor/edit-driver-as-sponsor';
import FireDriverButton from './Fire-Driver-Button';
import { ImpersonateButton } from '../AdminComponents/ImpersonateButton';
type Driver = {
  id: string;
  points: number;
  sponsorOrgId: string
  driver: {
    id: string;
    status: string;
    pointsBalance: number;
    user: {
      name: string;
      email: string;
      image: string | null;
      id: string;
      };
    };
  sponsorOrg?: {
    name: string;
  } | null;
  createdAt: Date;
};

type DriverListClientProps = {
  drivers: Driver[];
  isAdmin: boolean;
  initialCount: number;
};

type ContextMenuPosition = { x: number; y: number } | null;

export default function DriverListClient({ drivers, isAdmin, initialCount }: DriverListClientProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const [contextMenu, setContextMenu] = useState<ContextMenuPosition>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Driver>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredDrivers = useMemo(() => {
    if (!normalizedQuery) return drivers;
    return drivers.filter((driver) => {
      const name = driver.driver.user.name.toLowerCase();
      const email = driver.driver.user.email.toLowerCase();
      return name.includes(normalizedQuery) || email.includes(normalizedQuery);
    });
  }, [drivers, normalizedQuery]);

  const visibleDrivers = normalizedQuery
    ? filteredDrivers
    : filteredDrivers.slice(0, initialCount);

  const handleContextMenu = (e: React.MouseEvent, driver: Driver) => {
    e.preventDefault();
    setSelectedDriver(driver);
    setEditedData({ driver: { ...driver.driver } });
    setIsEditMode(false);
    setIsSaving(false);
    setPreviewImage(null);
    setNewImageBase64(null);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setSelectedDriver(null);
    setIsEditMode(false);
    setEditedData({});
    setIsSaving(false);
    setPreviewImage(null);
    setNewImageBase64(null);
  };

  const handleEdit = () => setIsEditMode(true);

  const handleCancelEdit = () => {
    if (selectedDriver) {
      setEditedData({ driver: { ...selectedDriver.driver } });
    }
    setPreviewImage(null);
    setNewImageBase64(null);
    setIsEditMode(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      setNewImageBase64(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!selectedDriver) return;
    setIsSaving(true);
    try {
      await updateDriverProfile(selectedDriver.id, {
        name: editedData.driver?.user.name,
        email: editedData.driver?.user.email,
        ...(newImageBase64 && { image: newImageBase64 }),
      });
      setIsSaving(false);
      setIsEditMode(false);
      setTimeout(() => closeContextMenu(), 300);
    } catch (error) {
      console.error('Error updating driver:', error);
      setIsSaving(false);
      alert(error instanceof Error ? error.message : 'Failed to update driver.');
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeContextMenu();
    };
    if (contextMenu) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [contextMenu]);

  const displayImage = previewImage ?? selectedDriver?.driver.user.image ?? null;

  return (
    <>
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email"
          className="w-full px-3 py-2 border rounded"
        />
        {!normalizedQuery && drivers.length > initialCount && (
          <p className="text-sm text-gray-500 mt-2">
            Showing first {initialCount} of {drivers.length} drivers
          </p>
        )}
      </div>

      {visibleDrivers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          {normalizedQuery ? "No matching drivers" : "No registered drivers"}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visibleDrivers.map((driver) => (
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
                  style={{ fontSize: '16px', fontWeight: '500', color: '#333', cursor: 'context-menu', display: 'inline-block' }}
                >
                  {driver.driver.user.name}
                </div>
                {isAdmin && driver.sponsorOrg && (
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
                    ({driver.sponsorOrg.name})
                  </span>
                )}
                <div style={{ fontSize: '14px', color: '#28a745', fontWeight: '600', marginLeft: '20px', marginTop: '5px' }}>
                  {driver.points} points
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {driver.sponsorOrgId && (
                <PointsButton
                  driverProfileId={driver.driver.id}
                  driverName={driver.driver.user.name}
                  sponsorId={driver.sponsorOrgId}

                />
              )}
              <ImpersonateButton targetUserId={driver.driver.user.id} />
              <FireDriverButton driver={driver} /> 
              </div>
            </div>
          ))}
        </div>
      )}

      {contextMenu && selectedDriver && (
        <>
          <div
            onClick={closeContextMenu}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(2px)'
            }}
          />
          <div
            ref={menuRef}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white', borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              zIndex: 1000, width: '90%', maxWidth: '500px',
              padding: '0', maxHeight: '90vh', overflow: 'auto'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #eee',
              backgroundColor: '#f8f9fa', borderRadius: '12px 12px 0 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#333' }}>
                Driver Profile
              </h3>
              <button
                onClick={handleEdit}
                disabled={isEditMode}
                style={{
                  backgroundColor: 'transparent', border: 'none',
                  cursor: isEditMode ? 'default' : 'pointer',
                  padding: '8px', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: isEditMode ? 0.5 : 1
                }}
                onMouseOver={(e) => !isEditMode && (e.currentTarget.style.backgroundColor = '#e9ecef')}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Edit driver"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>

            {/* Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '24px' }}>
              <div
                onClick={() => isEditMode && imageInputRef.current?.click()}
                style={{
                  position: 'relative', width: '80px', height: '80px',
                  cursor: isEditMode ? 'pointer' : 'default'
                }}
                title={isEditMode ? 'Click to change photo' : ''}
              >
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt="Driver"
                    style={{
                      width: '80px', height: '80px', borderRadius: '50%',
                      objectFit: 'cover', border: '3px solid #007bff'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    backgroundColor: '#007bff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '32px', fontWeight: 'bold',
                    border: '3px solid #0056b3'
                  }}>
                    {selectedDriver.driver.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {isEditMode && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '20px' }}>📷</span>
                  </div>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </div>
              {isEditMode && (
                <p style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                  Click photo to change
                </p>
              )}
            </div>

            {/* Profile Information */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!isEditMode ? (
                <>
                  <ProfileItem label="Name" value={selectedDriver.driver.user.name} />
                  <ProfileItem label="Email" value={selectedDriver.driver.user.email} />
                  <ProfileItem label="Status" value={selectedDriver.driver.status} />
                  {selectedDriver.sponsorOrg && <ProfileItem label="Sponsor" value={selectedDriver.sponsorOrg.name} />}
                  <ProfileItem label="Member Since" value={new Date(selectedDriver.createdAt).toLocaleDateString()} />
                </>
              ) : (
                <>
                  <EditField
                    label="Name"
                    value={editedData.driver?.user?.name || ''}
                    onChange={(value) => setEditedData(prev => ({ ...prev, user: { ...prev.driver!.user!, name: value } }))}
                  />
                  <EditField
                    label="Email"
                    type="email"
                    value={editedData.driver?.user?.email || ''}
                    onChange={(value) => setEditedData(prev => ({ ...prev, user: { ...prev.driver!.user!, email: value } }))}
                  />
                  {selectedDriver.sponsorOrg && <ProfileItem label="Sponsor" value={selectedDriver.sponsorOrg.name} />}
                  <ProfileItem label="Member Since" value={new Date(selectedDriver.createdAt).toLocaleDateString()} />
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #eee',
              display: 'flex', justifyContent: 'flex-end', gap: '12px'
            }}>
              {isEditMode ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    style={{
                      backgroundColor: '#6c757d', color: 'white', border: 'none',
                      padding: '10px 20px', borderRadius: '6px',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      fontSize: '14px', fontWeight: '500', opacity: isSaving ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      backgroundColor: '#28a745', color: 'white', border: 'none',
                      padding: '10px 20px', borderRadius: '6px',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      fontSize: '14px', fontWeight: '500', opacity: isSaving ? 0.6 : 1
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={closeContextMenu}
                  style={{
                    backgroundColor: '#6c757d', color: 'white', border: 'none',
                    padding: '10px 20px', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '14px', fontWeight: '500'
                  }}
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

function ProfileItem({ label, value, valueStyle = {} }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>{label}:</span>
      <span style={{ fontSize: '14px', color: '#333', ...valueStyle }}>{value}</span>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>{label}:</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '8px 12px', fontSize: '14px', color: '#111827',
          backgroundColor: '#fff', border: '1px solid #ddd',
          borderRadius: '4px', outline: 'none'
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = '#007bff'}
        onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
      />
    </div>
  );
}