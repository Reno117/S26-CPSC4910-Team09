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
    const [isOpen, setIsOpen]           = useState(false);
    const [alerts, setAlerts]           = useState<Alert[]>([]);
    const [alertsOpen, setAlertsOpen]   = useState(false);
    const alertsRef                     = useRef<HTMLDivElement>(null);
    const [stoppingImpersonation, setStoppingImpersonation] = useState(false);

    const session     = authClient.useSession();
    const user        = session.data?.user as { name?: string | null; role?: string | null; image?: string | null } | undefined;
    const displayName = user?.name ?? 'User';
    const sessionData = session.data?.session as { impersonatedBy?: string | null } | undefined;
    const isImpersonating = Boolean(sessionData?.impersonatedBy);
    const displayRole = user?.role
        ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`
        : 'User';

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setIsVisible(!(currentScrollY > lastScrollY && currentScrollY > 100));
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

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
            const res = await fetch('/api/auth/stop-impersonating', { method: 'POST', credentials: 'include' });
            if (!res.ok) throw new Error((await res.text()) || 'Failed to stop impersonation.');
            const data = (await res.json()) as { redirectPath?: string };
            window.location.href = data.redirectPath || '/sponsor';
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to stop impersonation.');
        } finally {
            setStoppingImpersonation(false);
        }
    };

    const unreadCount = alerts.length;

    return (
        <>
            <header
                className={`fixed top-0 w-full z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
                style={{ backgroundColor: '#0d2b45' }}
            >
                <div className="flex justify-between items-center px-6 h-16">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="text-white text-2xl focus:outline-none hover:opacity-70 transition-opacity"
                        >
                            ☰
                        </button>
                        <Link
                            href="/sponsor"
                            className="text-white text-sm font-light tracking-[0.18em] uppercase hover:opacity-70 transition-opacity"
                        >
                            Sponsor Dashboard
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        {isImpersonating && (
                            <button
                                onClick={handleStopImpersonation}
                                disabled={stoppingImpersonation}
                                className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black font-semibold text-xs px-3 py-1 rounded"
                            >
                                {stoppingImpersonation ? 'Returning...' : 'Exit Impersonation'}
                            </button>
                        )}

                        <div className="relative" ref={alertsRef}>
                            <button
                                onClick={() => setAlertsOpen((prev) => !prev)}
                                className="text-white text-xl focus:outline-none hover:opacity-70 transition-opacity"
                                title="Notifications"
                            >
                                🔔
                            </button>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] leading-4 rounded-full text-center font-semibold">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                            {alertsOpen && (
                                <div className="absolute right-0 top-10 w-80 bg-white text-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                        <span className="font-semibold text-sm">Notifications</span>
                                        {unreadCount > 0 && (
                                            <button onClick={handleMarkAllRead} className="text-xs text-blue-500 hover:text-blue-700">
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                                        {alerts.length === 0 ? (
                                            <li className="px-4 py-6 text-center text-sm text-gray-400">You're all caught up!</li>
                                        ) : (
                                            alerts.map((alert) => (
                                                <li key={alert.id} className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                                                    <span className="text-xl mt-0.5">{ALERT_ICONS[alert.alertType] ?? '🔔'}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-700 leading-snug">{alert.alertContent}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                                                    </div>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsOpen(true)}
                            className="text-white text-xl focus:outline-none hover:opacity-70 transition-opacity"
                            title="Settings"
                        >
                            ⚙️
                        </button>
                        <SettingsModal user={userSettings} isOpen={isOpen} onClose={() => setIsOpen(false)} />

                        <Link
                            href="/sponsor/profile"
                            className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center overflow-hidden hover:opacity-80 transition flex-shrink-0"
                            style={{ backgroundColor: '#1a4a6e' }}
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

            {/* Side drawer */}
            <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    className="absolute inset-0"
                    onClick={() => setMenuOpen(false)}
                />
                <div
                    className={`absolute left-0 top-0 h-full w-64 shadow-2xl transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    style={{ backgroundColor: '#0d2b45' }}
                >
                    <div className="p-6 flex flex-col h-full">
                        {/* User info */}
                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10 flex-shrink-0">
                            <div className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: '#1a4a6e' }}>
                                {user?.image ? (
                                    <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white text-sm font-bold">{(user?.name ?? 'S').charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div>
                                <p className="text-white text-sm font-semibold">{displayName}</p>
                                <p className="text-white/40 text-xs capitalize">{displayRole}</p>
                            </div>
                        </div>

                        <h2 className="text-white text-xs font-semibold tracking-widest uppercase mb-4 opacity-50 flex-shrink-0">Navigation</h2>

                        {/* Nav links */}
                        <ul className="space-y-1 overflow-y-auto flex-1 mb-4">
                            {[
                                { href: '/sponsor', label: 'Dashboard' },
                                { href: '/sponsor/driverApplications', label: 'Applications' },
                                { href: '/sponsor/create-driver', label: 'Make Driver' },
                                { href: '/sponsor/create-sponsor-user', label: 'Make Sponsor' },
                                { href: '/sponsor/catalog', label: 'View Catalog' },
                                { href: '/sponsor/catalog/add', label: 'Add to Catalog' },
                                { href: '/sponsor/view-orders', label: 'View Orders' },
                                { href: '/sponsor/sponsor-info', label: 'Sponsor Info' },
                                { href: '/sponsor/mass-upload-users', label: 'Bulk Upload Users' },
                                { href: '/sponsor/rules', label: 'Rules' },
                                { href: '/sponsor/reports', label: 'Reports' },
                            ].map(({ href, label }) => (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        onClick={() => setMenuOpen(false)}
                                        className="block px-4 py-3 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors text-base"
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {/* Logout — pinned to bottom */}
                        <button
                            onClick={handleLogout}
                            className="w-full bg-red-500/80 hover:bg-red-500 text-white py-2 rounded-lg transition text-sm flex-shrink-0"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}