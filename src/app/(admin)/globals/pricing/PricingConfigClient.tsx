"use client";

import React, { useState } from "react";
import { PlusIcon, TrashBinIcon, CheckLineIcon, InfoIcon } from "@/icons/index";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/form/switch/Switch";
import { updatePricingConfig } from "@/lib/actions/globals";

interface MarkupTier {
    upto?: number;
    percent: number;
}

export default function PricingConfigClient({
    initialConfig,
}: {
    initialConfig: any;
}) {
    const [config, setConfig] = useState(initialConfig || {
        configId: "pricing:globalMarkup",
        configType: "PRICING",
        scope: "GLOBAL",
        enabled: true,
        data: { markupTiers: [] }
    });

    const legacyTiers: MarkupTier[] = [
        { upto: 50, percent: 28 },
        { upto: 100, percent: 25 },
        { upto: 250, percent: 20 },
        { upto: 300, percent: 15 },
        { upto: 350, percent: 12 },
        { percent: 10 },
    ];

    const [tiers, setTiers] = useState<MarkupTier[]>(
        config.data?.markupTiers && config.data.markupTiers.length > 0 
        ? config.data.markupTiers 
        : legacyTiers
    );
    const [isSaving, setIsSaving] = useState(false);

    const addTier = () => {
        setTiers([...tiers, { upto: 0, percent: 0 }]);
    };

    const removeTier = (index: number) => {
        setTiers(tiers.filter((_, i) => i !== index));
    };

    const updateTier = (index: number, field: keyof MarkupTier, value: number) => {
        const newTiers = [...tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setTiers(newTiers);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            // Sort tiers by 'upto' before saving
            const sortedTiers = [...tiers].sort((a, b) => (a.upto || 999999) - (b.upto || 999999));
            
            const payload = {
                ...config,
                data: {
                    ...config.data,
                    markupTiers: sortedTiers
                }
            };

            const updated = await updatePricingConfig(payload);
            setConfig(updated);
            setTiers(updated.data?.markupTiers || []);
            alert("Pricing configuration updated successfully!");
        } catch (err: any) {
            alert(err.message || "Failed to save configuration");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-white/[0.05] shadow-sm overflow-hidden">
                {/* Header Section */}
                <div className="p-6 md:p-8 border-b border-gray-50 dark:border-white/[0.03]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400">
                                    <InfoIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white/90">
                                    Tiered Markup Rules
                                </h2>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                                Define how much the platform fee (markup) should be applied based on the base price of the item. 
                                Items are matched against the first tier where the price is less than or equal to the "Up to" value.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/[0.05]">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 dark:text-white/90">System Status</span>
                                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                                    {config.enabled ? "Active" : "Disabled"}
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

                {/* Tiers List */}
                <div className="p-6 md:p-8 space-y-6">
                    {tiers.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border-2 border-dashed border-gray-100 dark:border-white/[0.05]">
                            <p className="text-sm text-gray-400 mb-4 font-medium">No custom tiers defined yet.</p>
                            <p className="text-xs text-gray-500 mb-6">The system will use hardcoded legacy fallbacks if no tiers are present.</p>
                            <Button variant="outline" onClick={addTier} className="mx-auto flex items-center gap-2">
                                <PlusIcon className="w-4 h-4" />
                                Add First Tier
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <div className="col-span-1">No.</div>
                                <div className="col-span-5">Up to Price (₹)</div>
                                <div className="col-span-4">Markup (%)</div>
                                <div className="col-span-2 text-right">Action</div>
                            </div>
                            
                            {tiers.map((tier, index) => (
                                <div 
                                    key={index}
                                    className="grid grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] group transition-all hover:shadow-md hover:border-brand-200 dark:hover:border-brand-500/20"
                                >
                                    <div className="col-span-1 text-sm font-bold text-gray-400">
                                        {index + 1}
                                    </div>
                                    <div className="col-span-5">
                                        {tier.upto !== undefined ? (
                                            <Input
                                                type="number"
                                                placeholder="e.g. 100 (for prices < 100)"
                                                value={tier.upto || ""}
                                                onChange={(e) => updateTier(index, "upto", Number(e.target.value))}
                                                className="bg-white dark:bg-gray-800"
                                            />
                                        ) : (
                                            <div className="h-11 flex items-center px-4 bg-gray-100 dark:bg-white/[0.03] rounded-lg text-xs font-bold text-gray-500 uppercase tracking-widest border border-transparent">
                                                Base / Default
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-4">
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                placeholder="e.g. 25"
                                                value={tier.percent || ""}
                                                onChange={(e) => updateTier(index, "percent", Number(e.target.value))}
                                                className="bg-white dark:bg-gray-800 pr-10"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <button 
                                            onClick={() => removeTier(index)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                            title="Delete Tier"
                                        >
                                            <TrashBinIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-between items-center pt-4">
                                <Button 
                                    variant="outline" 
                                    onClick={addTier}
                                    className="flex items-center gap-2 border-2 border-brand-100 text-brand-600 hover:bg-brand-50"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add Another Tier
                                </Button>
                                
                                <div className="text-xs text-gray-400 italic">
                                    * Tiers will be automatically sorted by price on save.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="p-6 md:p-8 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-50 dark:border-white/[0.03] flex items-center justify-between">
                    <div className="flex items-start gap-3 max-w-md">
                        <div className="mt-1">
                            <InfoIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                            CAUTION: These changes are global and live. They will immediately affect all price calculations across the platform for items where markup is applicable.
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
                                Save Configuration
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Legacy Fallback Card (Read-only reference) */}
            <div className="mt-8 p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
                    Legacy Fallback Reference
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-white/50 dark:bg-white/[0.02] rounded-xl border border-amber-100/50">
                        <span className="text-amber-600 font-bold tracking-tight">Up to ₹50:</span>
                        <span className="ml-2 font-mono text-amber-800 dark:text-amber-300">28%</span>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-white/[0.02] rounded-xl border border-amber-100/50">
                        <span className="text-amber-600 font-bold tracking-tight">Up to ₹100:</span>
                        <span className="ml-2 font-mono text-amber-800 dark:text-amber-300">25%</span>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-white/[0.02] rounded-xl border border-amber-100/50">
                        <span className="text-amber-600 font-bold tracking-tight">Up to ₹250:</span>
                        <span className="ml-2 font-mono text-amber-800 dark:text-amber-300">20%</span>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-white/[0.02] rounded-xl border border-amber-100/50">
                        <span className="text-amber-600 font-bold tracking-tight">Up to ₹300:</span>
                        <span className="ml-2 font-mono text-amber-800 dark:text-amber-300">15%</span>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-white/[0.02] rounded-xl border border-amber-100/50">
                        <span className="text-amber-600 font-bold tracking-tight">Up to ₹350:</span>
                        <span className="ml-2 font-mono text-amber-800 dark:text-amber-300">12%</span>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-white/[0.02] rounded-xl border border-amber-100/50">
                        <span className="text-amber-600 font-bold tracking-tight">Above ₹350:</span>
                        <span className="ml-2 font-mono text-amber-800 dark:text-amber-300">10%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
