"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutDashboard, LogOut } from "lucide-react";

export function DashboardHeader() {
    const pathname = usePathname();
    const isDashboard = pathname === "/dashboard";

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Left: Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 group-hover:bg-indigo-700 transition-colors">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                        ResumeAI
                    </span>
                </Link>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {isDashboard ? (
                        <SignOutButton redirectUrl="/">
                            <Button variant="ghost" className="text-slate-600 hover:text-red-600 hover:bg-red-50">
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </SignOutButton>
                    ) : (
                        <Button variant="ghost" asChild className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                            <Link href="/dashboard">
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
