'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function DriverHeader() {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    
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
                    href="/driver"
                    className="text-xl font-bold hover:text-blue-100"
                >
                    Driver Dashboard
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
                        onClick={() => {/* Handle settings click */}}
                        className="text-white text-2xl focus:outline-none hover:text-blue-200"
                        title="Settings"
                    >
                        ⚙️
                    </button>
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="text-white text-2xl focus:outline-none hover:text-blue-200"
                        title="Profile"
                    >
                        👤
                    </button>
                </div>
            </div>
        </header>

        {/* Hamburger Menu Sidebar */}
        <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="bg-black bg-opacity-50 absolute inset-0" onClick={() => setMenuOpen(false)}></div>
            <div className={`absolute left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">Menu</h2>
                    <ul className="space-y-2">
                        <li><Link href="/driver" className="block p-2 hover:bg-gray-200 text-black-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
                        <li><Link href="/driver" className="block p-2 hover:bg-gray-200 text-black-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>Settings</Link></li>
                        <li><Link href="/driver" className="block p-2 hover:bg-gray-200 text-black-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>Sponsor Catalog</Link></li>
                        <li><Link href="/driver/mysponsor" className="block p-2 hover:bg-gray-200 text-black-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>My Sponsor</Link></li>
                        <li><Link href="/driver/pointshistory" className="block p-2 hover:bg-gray-200 text-black-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>Points History</Link></li>
                        <li><Link href="/driver/profile" className="block p-2 hover:bg-gray-200 text-black-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>Profile</Link></li>
                        {/* Add more menu items as needed */}
                    </ul>
                </div>
            </div>
        </div>

        {/* Profile Dropdown */}
        {profileOpen && (
            <div className="fixed top-16 right-4 bg-white shadow-lg rounded-md z-50 w-48">
                <div className="p-4">
                    <p className="text-sm text-gray-600">Logged in as: <strong>User</strong></p>
                    <p className="text-sm text-gray-600">Role: <strong>Driver</strong></p>
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