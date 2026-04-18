'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { getUnreadAlerts, markAllAlertsRead } from '@/app/actions/alerts/get-alerts';

type Alert = {
    id: string;
    alertType: string;
    alertContent: string;
    createdAt: Date;
    isRead: boolean;
};

const ALERT_ICONS: Record<string, string> = {
    ORDER: '📦',
    POINT_CHANGE: '⭐',
    PASSWORD_CHANGE: '🔒',
    ADMIN_CHANGE: '🛠️',
    APPLICATION: '📋',
    STATUS: '🔄',
};

export default function AdminHeader() {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [alertsOpen, setAlertsOpen] = useState(false);
    const alertsRef = useRef<HTMLDivElement>(null);
    const session = authClient.useSession();
    const user = session.data?.user as { name?: string | null; image?: string | null } | undefined;

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
        return () => {
            isMounted = false;
            clearInterval(id);
        };
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

    const handleBellClick = () => setAlertsOpen((prev) => !prev);

    const handleMarkAllRead = async () => {
        await markAllAlertsRead();
        setAlerts([]);
        setAlertsOpen(false);
    };

    const unreadCount = alerts.length;

    return (
        <>
            <header
                className={`fixed top-0 w-full z-50 transition-transform duration-300 ${
                    isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
                style={{ backgroundColor: '#0d2b45' }}
            >
                <div className="flex justify-between items-center px-6 h-16">
                    {/* Left: hamburger + brand */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="text-white text-2xl focus:outline-none hover:opacity-70 transition-opacity"
                        >
                            ☰
                        </button>
                        <Link
                    href="/admin"
                    className="text-white text-sm font-light tracking-[0.18em] uppercase hover:opacity-70 transition-opacity"
                >
                    Admin Dashboard
                </Link>
                    </div>

                    {/* Right: alerts, settings, profile */}
                    <div className="flex items-center gap-4">
                        <div className="relative" ref={alertsRef}>
                            <button
                                onClick={handleBellClick}
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
                                            <button
                                                onClick={handleMarkAllRead}
                                                className="text-xs text-blue-500 hover:text-blue-700"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
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

                        <Link
                            href="/admin/settings"
                            className="text-white text-xl focus:outline-none hover:opacity-70 transition-opacity"
                            title="Settings"
                        >
                            ⚙️
                        </Link>

                        <Link
                            href="/admin/profile"
                            className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center overflow-hidden hover:opacity-80 transition flex-shrink-0"
                            style={{ backgroundColor: '#1a4a6e' }}
                            title="Profile"
                        >
                            {user?.image ? (
                                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-sm font-bold">
                                    {(user?.name ?? 'A').charAt(0).toUpperCase()}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </header>

            {/* Side drawer */}
            <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                className="absolute inset-0"
                onClick={() => setMenuOpen(false)}
                />
                <div
                    className={`absolute left-0 top-0 h-full w-64 shadow-2xl transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    style={{ backgroundColor: '#0d2b45' }}
                >
                    <div className="p-6">
                        <h2 className="text-white text-xs font-semibold tracking-widest uppercase mb-8 opacity-50">Navigation</h2>
                        <ul className="space-y-1">
                            {[
                                { href: '/admin', label: 'Manage Users' },
                                { href: '/admin/create-users', label: 'Create Users' },
                                { href: '/admin/create-sponsor-org', label: 'Create Sponsor Org' },
                                { href: '/admin/view-catalogs', label: 'View Catalogs' },
                                { href: '/admin/all-orders', label: 'Orders' },
                                { href: '/admin/rules', label: 'Rules' },
                                { href: '/admin/audit', label: 'Audits' },
                                { href: '/admin/reports', label: 'Reports' },
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
                    </div>
                </div>
            </div>
        </>
    );
}