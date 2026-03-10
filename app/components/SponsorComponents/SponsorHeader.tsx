'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import SettingsModal from '../Settings-Modal';

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
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const session = authClient.useSession();
    const user = session.data?.user as { name?: string | null; role?: string | null; image?: string | null } | undefined;
    const displayName = user?.name ?? 'User';
    const displayRole = user?.role
        ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`
        : 'User';

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

    const handleLogout = async () => {
        await authClient.signOut();
        window.location.href = '/login';
    };

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
                    <Link
                        href="/sponsor"
                        className="text-xl font-bold hover:text-blue-100"
                    >
                        Sponsor Dashboard
                    </Link>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => {/* Handle shopping cart click */}}
                            className="text-white text-2xl focus:outline-none hover:text-blue-200"
                            title="Shopping Cart"
                        >
                            🛒
                        </button>
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
                        {/* Avatar — links to profile page */}
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
                        {/* Sidebar user info */}
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
                            <li><Link href="/sponsor/audits" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Audits</Link></li>
                            <li><Link href="/sponsor/catalog" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>View Catalog</Link></li>
                            <li><Link href="/sponsor/catalog/add" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Add to Catalog</Link></li>
                            <li><Link href="/sponsor/view-orders" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>View Orders</Link></li>
                            <li><Link href="/sponsor/sponsor-info" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Sponsor Info</Link></li>
                            <li><Link href="/sponsor/mass-upload-users" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Bulk Upload Users</Link></li>
                            <li><Link href="/sponsor/rules" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-sm" onClick={() => setMenuOpen(false)}>Rules</Link></li>
                        </ul>

                        {/* Logout at bottom of sidebar */}
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
                        <button
                            onClick={handleLogout}
                            className="mt-2 w-full bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
