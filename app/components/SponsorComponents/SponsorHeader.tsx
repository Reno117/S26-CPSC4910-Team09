'use client';
 
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import SettingsModal from '../Settings-Modal';
import { getUnreadAlerts, markAllAlertsRead } from '@/app/actions/admin/alert-get-new';

type Alert = {
  id: string;
  alertType: string;
  alertContent: string;
  createdAt: Date;
  isRead: boolean;
};
 
const ALERT_ICONS: Record<string, string> = {
  ORDER:           '📦',
  POINT_CHANGE:    '⭐',
  PASSWORD_CHANGE: '🔒',
  ADMIN_CHANGE:    '🛠️',
  APPLICATION:     '📋',
  STATUS:          '🔄',
};
 
interface User {
    name: string;
    email: string;
    role: string;
    image?: string | null;
}
 
interface HeaderProps {
    userSettings: User;
}
 
export default function SponsorHeader({ userSettings }: HeaderProps) {
    const [isVisible, setIsVisible]     = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [menuOpen, setMenuOpen]       = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [isOpen, setIsOpen]           = useState(false);
 
    // --- Alert state ---
    const [alerts, setAlerts]       = useState<Alert[]>([]);
    const [alertsOpen, setAlertsOpen] = useState(false);
    const alertsRef                 = useRef<HTMLDivElement>(null);
 
    const [stoppingImpersonation, setStoppingImpersonation] = useState(false);
    const session     = authClient.useSession();
    const user        = session.data?.user as { name?: string | null; role?: string | null; image?: string | null } | undefined;
    const displayName = user?.name ?? 'User';
    const sessionData = session.data?.session as { impersonatedBy?: string | null } | undefined;
    const isImpersonating = Boolean(sessionData?.impersonatedBy);
    const displayRole = user?.role
        ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`
        : 'User';
 
    // Scroll hide/show
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);
 
    // Alert polling — every 30 seconds
    useEffect(() => {
        let isMounted = true;
        const loadAlerts = async () => {
            try {
                const data = await getUnreadAlerts();
                if (isMounted) setAlerts(data);
            } catch {}
        };
        loadAlerts();
        const id = setInterval(loadAlerts, 30000);
        return () => { isMounted = false; clearInterval(id); };
    }, []);
 
    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
                setAlertsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
 
    const handleMarkAllRead = async () => {
        await markAllAlertsRead();
        setAlerts([]);
        setAlertsOpen(false);
    };
 
    const handleLogout = async () => {
        await authClient.signOut();
        window.location.href = '/login';
    };


  const handleStopImpersonation = async () => {
    try {
      setStoppingImpersonation(true);
      const res = await fetch('/api/auth/stop-impersonating', {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Failed to stop impersonation.');
      }

      const data = (await res.json()) as { redirectPath?: string };
      window.location.href = data.redirectPath || '/sponsor';
    } catch (error) {
      console.error('Failed to stop impersonation:', error);
      alert(error instanceof Error ? error.message : 'Failed to stop impersonation.');
    } finally {
      setStoppingImpersonation(false);
    }
  };
 
    const unreadCount = alerts.length;
 
    return (
        <>
            <header className={`fixed top-0 w-full bg-blue-400 text-white transition-transform duration-300 z-50 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="flex justify-between items-center p-4 h-16">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-white text-2xl focus:outline-none"
                    >
                        ☰
                    </button>
                    <Link href="/sponsor" className="text-xl font-bold hover:text-blue-100">
                        Sponsor Dashboard
                    </Link>
                    <div className="flex items-center space-x-2">
            {isImpersonating && (
              <button
                onClick={handleStopImpersonation}
                disabled={stoppingImpersonation}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black font-semibold text-xs px-3 py-1 rounded"
                title="Return to your original account"
              >
                {stoppingImpersonation ? 'Returning...' : 'Exit Impersonation'}
              </button>
            )}
 
                        {/* Bell */}
                        <div className="relative" ref={alertsRef}>
                            <button
                                onClick={() => setAlertsOpen((prev) => !prev)}
                                className="text-white text-2xl focus:outline-none hover:text-blue-200"
                                title="Notifications"
                            >
                                🔔
                            </button>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] leading-4 rounded-full text-center font-semibold">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
 
                            {/* Dropdown */}
                            {alertsOpen && (
                                <div className="absolute right-0 top-10 w-80 bg-white text-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                        <span className="font-semibold text-sm">Notifications</span>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllRead}
                                                className="text-xs text-blue-400 hover:text-blue-600"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
 
                                    {/* Alert list */}
                                    <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                                        {alerts.length === 0 ? (
                                            <li className="px-4 py-6 text-center text-sm text-gray-400">
                                                You're all caught up!
                                            </li>
                                        ) : (
                                            alerts.map((alert) => (
                                                <li key={alert.id} className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                                    <span className="text-xl mt-0.5">
                                                        {ALERT_ICONS[alert.alertType] ?? '🔔'}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-700 leading-snug">{alert.alertContent}</p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {new Date(alert.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
 
                        {/* Settings */}
                        <button
                            onClick={() => setIsOpen(true)}
                            className="text-white text-2xl focus:outline-none hover:text-blue-200"
                            title="Settings"
                        >
                            ⚙️
                        </button>
                        <SettingsModal
                            user={userSettings}
                            isOpen={isOpen}
                            onClose={() => setIsOpen(false)}
                        />
 
                        {/* Avatar */}
                        <Link
                            href="/sponsor/profile"
                            className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center overflow-hidden hover:opacity-80 transition flex-shrink-0"
                            title="Profile"
                        >
                            {user?.image ? (
                                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-sm font-bold">
                                    {(user?.name ?? 'S').charAt(0).toUpperCase()}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </header>
 
            {/* Hamburger Menu Sidebar */}
            <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="bg-black bg-opacity-50 absolute inset-0" onClick={() => setMenuOpen(false)}></div>
                <div className={`absolute left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-blue-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {user?.image ? (
                                    <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white text-sm font-bold">
                                        {(user?.name ?? 'S').charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">{displayName}</p>
                                <p className="text-xs text-gray-400 capitalize">{displayRole}</p>
                            </div>
                        </div>
 
                        <h2 className="text-lg font-bold mb-4 text-gray-800">Menu</h2>
                        <ul className="space-y-2">
                            <li><Link href="/sponsor" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
                            <li><Link href="/sponsor/driverApplications" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Applications</Link></li>
                            <li><Link href="/sponsor/create-driver" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Make Driver</Link></li>
                            <li><Link href="/sponsor/catalog" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>View Catalog</Link></li>
                            <li><Link href="/sponsor/catalog/add" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Add to Catalog</Link></li>
                            <li><Link href="/sponsor/view-orders" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>View Orders</Link></li>
                            <li><Link href="/sponsor/sponsor-info" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Sponsor Info</Link></li>
                            <li><Link href="/sponsor/mass-upload-users" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Bulk Upload Users</Link></li>
                            <li><Link href="/sponsor/rules" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Rules</Link></li>
                            <li><Link href="/sponsor/reports" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Reports</Link></li>
                        </ul>
 
                        <div className="absolute bottom-6 left-4 right-4">
                            <button
                                onClick={handleLogout}
                                className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
 
            {/* Profile Dropdown */}
            {profileOpen && (
                <div className="fixed top-16 right-4 bg-white shadow-lg rounded-md z-50 w-48">
                    <div className="p-4">
                        <p className="text-sm text-gray-600">Logged in as: <strong>{displayName}</strong></p>
                        <p className="text-sm text-gray-600">Role: <strong>{displayRole}</strong></p>
                        <button onClick={handleLogout} className="mt-2 w-full bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600">
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}