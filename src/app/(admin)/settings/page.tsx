"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Settings } from "lucide-react";

export default function SettingsPage() {
    return (
        <ProtectedRoute>
            <main className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-500 mt-1">Manage your shop's settings and preferences.</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                    <div className="text-center py-16 px-4">
                        <div className="flex justify-center mb-4">
                            <div className="bg-gray-100 p-4 rounded-full">
                                <Settings className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Settings Coming Soon</h3>
                        <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                            The settings module is currently under development.
                        </p>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
