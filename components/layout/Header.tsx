"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Building2,
    Store,
    Link as LinkIcon,
    LogOut,
    Database,
    Layers
} from "lucide-react";

const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Projects", icon: Briefcase, href: "/projects" },
    { label: "Users", icon: Users, href: "/users" },
    { label: "Clients", icon: Building2, href: "/clients" },
    { label: "Vendors", icon: Store, href: "/vendors" },
    { label: "Links", icon: LinkIcon, href: "/links" },
    { label: "Client Api Data", icon: Database, href: "/client-api-data" },
    { label: "Zampila", icon: Layers, href: "/zampila" },
];

export function Header() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback: redirect via GET
            window.location.href = '/api/auth/logout';
        }
    };

    return (
        <header className="w-full text-white shadow-md">
            {/* Top Brand Bar */}
            <div className="bg-gradient-to-r from-inexra-navy to-inexra-teal px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="relative h-10 w-auto flex items-center">
                        <div className="bg-white/95 rounded-md p-1.5 shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/inexra-logo.jpg" alt="INEXRA Logo" className="h-8 w-auto object-contain" />
                        </div>
                    </div>
                    <span className="font-bold text-xl tracking-wide hidden sm:block text-white drop-shadow-sm">
                        INEXRA
                    </span>
                </div>

                {/* Top Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-medium hover:text-teal-200 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>

            {/* Navigation Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 overflow-x-auto">
                <nav className="flex items-center gap-1 min-w-max">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-2 px-3 py-2 text-inexra-navy hover:text-white hover:bg-inexra-teal rounded-md transition-all text-sm font-medium"
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-all text-sm font-medium ml-2 cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </nav>
            </div>
        </header>
    );
}
