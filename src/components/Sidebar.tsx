"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
    LayoutDashboard, 
    Receipt, 
    Users, 
    WalletCards, 
    Settings, 
    LogOut,
    Store
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Orders", href: "/orders", icon: Receipt },
    { name: "Users", href: "/users", icon: Users },
    { name: "Expenses", href: "/expenses", icon: WalletCards },
    { name: "Services", href: "/services", icon: Store },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <div className="flex h-full w-64 flex-col bg-[#0e1424] border-r border-card-border">
            <div className="flex h-16 shrink-0 items-center px-6 bg-[#0B0F19]">
                <Store className="w-8 h-8 text-teal-500 mr-3" />
                <span className="text-xl font-bold text-white tracking-tight">Ezyworkz Web</span>
            </div>
            
            <nav className="flex flex-1 flex-col mt-6 px-4">
                <ul role="list" className="flex flex-1 flex-col gap-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`
                                        group flex gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 transition-all
                                        ${isActive 
                                            ? "bg-teal-500/10 text-teal-400" 
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                        }
                                    `}
                                >
                                    <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-teal-400" : "text-slate-500 group-hover:text-white"}`} />
                                    {item.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
                
                <div className="mt-auto pb-6">
                    <button
                        onClick={logout}
                        className="group flex w-full gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 text-slate-400 hover:text-white hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-red-400" />
                        <span className="group-hover:text-red-400">Sign out</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
