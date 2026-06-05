"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Settings } from "lucide-react";

export default function SettingsPage() {
    return (
        <ProtectedRoute>
            <main className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Settings</h1>
                        <p className="text-slate-400 mt-1">Manage your shop's settings and preferences.</p>
                    </div>
                </div>

                <div className="bg-[#0e1424] rounded-3xl border border-card-border shadow-sm p-6">
                    <div className="text-center py-16 px-4">
                        <div className="flex justify-center mb-4">
                            <div className="bg-slate-800 p-4 rounded-full">
                                <Settings className="w-8 h-8 text-slate-400" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-white">Settings Coming Soon</h3>
                        <p className="mt-2 text-slate-400 max-w-sm mx-auto">
                            The settings module is currently under development.
                        </p>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
