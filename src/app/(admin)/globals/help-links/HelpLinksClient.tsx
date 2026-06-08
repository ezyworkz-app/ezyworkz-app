"use client";

import React, { useState } from "react";
import { CheckLineIcon, InfoIcon, VideoIcon } from "@/icons/index";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/form/switch/Switch";
import { updateHelpLinksConfig } from "@/lib/actions/globals";

export default function HelpLinksClient({
    initialConfig,
}: {
    initialConfig: any;
}) {
    const [config, setConfig] = useState(initialConfig || {
        configId: "shopAppHelpLinks",
        configType: "OTHER",
        scope: "GLOBAL",
        enabled: true,
        data: {
            dashboard: "",
            orders: "",
            services: "",
            offers: "",
            more: ""
        }
    });

    const [isSaving, setIsSaving] = useState(false);

    const updateLink = (key: string, value: string) => {
        setConfig({
            ...config,
            data: {
                ...config.data,
                [key]: value
            }
        });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const updated = await updateHelpLinksConfig(config);
            setConfig(updated);
            alert("Help links configuration updated successfully!");
        } catch (err: any) {
            alert(err.message || "Failed to save configuration");
        } finally {
            setIsSaving(false);
        }
    };

    const linkFields = [
        { key: "dashboard", label: "Dashboard Tab", description: "Tutorial for stats and trends" },
        { key: "orders", label: "Orders Tab", description: "Tutorial for managing order lifecycles" },
        { key: "services", label: "Services Tab", description: "Tutorial for menu and item management" },
        { key: "offers", label: "Offers Tab", description: "Tutorial for creating promotions" },
        { key: "more", label: "More Tab", description: "Tutorial for general shop settings" },
    ];

    return (
        <div className="max-w-4xl">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/[0.05] shadow-sm overflow-hidden">
                {/* Header Section */}
                <div className="p-6 md:p-8 border-b border-gray-50 dark:border-white/[0.03]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400">
                                    <VideoIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white/90">
                                    Shop App Tutorial Links
                                </h2>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                                Configure YouTube playlist or video links for each section of the Shop App. 
                                Banners will automatically appear in the app when a link is provided.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/[0.05]">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 dark:text-white/90">Feature Status</span>
                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                                    {config.enabled ? "Enabled" : "Disabled"}
                                </span>
                            </div>
                            <Switch 
                                label="" 
                                checked={config.enabled} 
                                onChange={(checked) => setConfig({ ...config, enabled: checked })} 
                            />
                        </div>
                    </div>
                </div>

                {/* Links List */}
                <div className="p-6 md:p-8 space-y-8">
                    {linkFields.map((field) => (
                        <div key={field.key} className="space-y-3">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <label className="text-sm font-bold text-gray-900 dark:text-white/90">
                                        {field.label}
                                    </label>
                                    <p className="text-xs text-gray-400">{field.description}</p>
                                </div>
                            </div>
                            <div className="relative">
                                <Input
                                    type="url"
                                    placeholder="https://www.youtube.com/playlist?list=..."
                                    value={config.data?.[field.key] || ""}
                                    onChange={(e) => updateLink(field.key, e.target.value)}
                                    className="bg-gray-50/50 dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.05] focus:ring-brand-500"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {config.data?.[field.key] ? (
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-green-500 uppercase tracking-tight">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            Active
                                        </div>
                                    ) : (
                                        <div className="text-[10px] font-bold text-gray-300 uppercase tracking-tight">
                                            Hidden
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer / Actions */}
                <div className="p-6 md:p-8 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-50 dark:border-white/[0.03] flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-3 max-w-md">
                        <div className="mt-1">
                            <InfoIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                            Links must be valid YouTube URLs. If a link is left empty, the help banner for that specific section will not be shown in the app.
                        </p>
                    </div>
                    
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="flex items-center gap-2 min-w-[160px] shadow-lg shadow-brand-500/20 py-3 rounded-2xl"
                    >
                        {isSaving ? "Saving..." : (
                            <>
                                <CheckLineIcon className="w-5 h-5" />
                                Save Help Links
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
