'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { getCartItemCount } from '@/app/actions/driver/cart-actions';

export default function DriverHeader() {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [cartItemCount, setCartItemCount] = useState(0);
    const session = authClient.useSession();
    const user = session.data?.user as { name?: string | null; role?: string | null; image?: string | null } | undefined;
    const displayName = user?.name ?? 'User';
    const displayRole = user?.role
        ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`
        : 'User';
    const router = useRouter();
    const pathname = usePathname();

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

        const loadCartCount = async () => {
            try {
                const count = await getCartItemCount();
                if (isMounted) {
                    setCartItemCount(count);
                }
            } catch {
                if (isMounted) {
                    setCartItemCount(0);
                }
            }
        };

        loadCartCount();

        const intervalId = setInterval(loadCartCount, 5000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [pathname]);

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
                        <div className="relative">
                            <button
                                onClick={() => router.push('/driver/cart')}
                                className="text-white text-2xl focus:outline-none hover:text-blue-200"
                                title="Shopping Cart"
                            >
                                🛒
                            </button>
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] leading-4 rounded-full text-center font-semibold">
                                    {cartItemCount > 99 ? '99+' : cartItemCount}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => {/* Handle settings click */}}
                            className="text-white text-2xl focus:outline-none hover:text-blue-200"
                            title="Settings"
                        >
                            ⚙️
                        </button>
                        {/* Avatar — links to profile page */}
                        <Link
                            href="/driver/profile"
                            className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center overflow-hidden hover:opacity-80 transition flex-shrink-0"
                            title="Profile"
                        >
                            {user?.image ? (
                                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-sm font-bold">
                                    {(user?.name ?? 'D').charAt(0).toUpperCase()}
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
                                        {(user?.name ?? 'D').charAt(0).toUpperCase()}
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
                            <li><Link href="/driver" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
                            <li><Link href="/driver" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>Settings</Link></li>
                            <li><Link href="/driver/apply" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>Apply to a Sponsor</Link></li>
                            <li><Link href="/driver/catalog" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>Sponsor Catalog</Link></li>
                            <li><Link href="/driver/orders" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>Order History</Link></li>
                            <li><Link href="/driver/mysponsor" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>My Sponsor</Link></li>
                            <li><Link href="/driver/pointshistory" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>Points History</Link></li>
                            <li><Link href="/driver/profile" className="block p-2 hover:bg-gray-200 text-gray-700 hover:text-blue-400 text-xl" onClick={() => setMenuOpen(false)}>Profile</Link></li>
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