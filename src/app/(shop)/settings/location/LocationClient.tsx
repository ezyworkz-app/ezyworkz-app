"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import { updateShopDetails } from "@/lib/actions/shops";
import { Loader2, Save, CheckCircle2, MapPin, Clock } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function LocationClient() {
    const { selectedShopId, selectedShop, isLoading: isShopLoading, refreshShop } = useShop();

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const shopData = selectedShop || {};

    const [address, setAddress] = useState({
        building: shopData.address?.building || "",
        street: shopData.address?.street || "",
        area: shopData.address?.area || "",
        city: shopData.address?.city || "",
        state: shopData.address?.state || "",
        pincode: shopData.address?.pincode || ""
    });

    const defaultTiming = {
        monday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        tuesday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        wednesday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        thursday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        friday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        saturday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        sunday: { working: false, slots: [{ open: "09:00", close: "18:00" }] },
    };

    const [shopTiming, setShopTiming] = useState<any>({ ...defaultTiming, ...(shopData.shopTiming || {}) });

    useEffect(() => {
        if (selectedShop) {
            if (selectedShop.address) {
                setAddress({
                    building: selectedShop.address.building || "",
                    street: selectedShop.address.street || "",
                    area: selectedShop.address.area || "",
                    city: selectedShop.address.city || "",
                    state: selectedShop.address.state || "",
                    pincode: selectedShop.address.pincode || "",
                });
            }
            if (selectedShop.shopTiming) {
                setShopTiming((prev: any) => ({ ...defaultTiming, ...selectedShop.shopTiming }));
            }
        }
    }, [selectedShop]);

    const activeShopId = selectedShopId;

    const handleSave = async () => {
        if (!activeShopId) return;
        setIsSaving(true);
        setSaveMessage(null);

        const payload = {
            address,
            shopTiming,
        };

        const result = await updateShopDetails(activeShopId, payload);
        setIsSaving(false);

        if (result.success) {
            setSaveMessage("Settings saved successfully!");
            await refreshShop();
            setTimeout(() => setSaveMessage(null), 3000);
        } else {
            alert(`Failed to save: ${result.error}`);
        }
    };

    const handleAddressChange = (field: string, value: string) => {
        setAddress(prev => ({ ...prev, [field]: value }));
    };

    const handleTimingChange = (day: string, field: string, value: any) => {
        setShopTiming((prev: any) => {
            const daySchedule = { ...prev[day] };
            if (field === "working") {
                daySchedule.working = value;
            } else if (field === "open" || field === "close") {
                if (!daySchedule.slots || daySchedule.slots.length === 0) {
                    daySchedule.slots = [{ open: "09:00", close: "18:00" }];
                }
                daySchedule.slots[0][field] = value;
            }
            return { ...prev, [day]: daySchedule };
        });
    };

    if (isShopLoading) {
        return (
            <ProtectedRoute>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8 overflow-y-auto h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Location & Timings</h1>
                        <p className="text-gray-500 mt-1">Manage your physical address and operational hours.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {saveMessage && (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> {saveMessage}
                            </span>
                        )}
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium disabled:opacity-70 transition-colors shadow-sm"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </div>

                <div className="pb-12 max-w-3xl space-y-8">
                    {/* Address & Location */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <MapPin className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-lg font-bold text-gray-900">Address & Location</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Building / Shop No.</label>
                                <input 
                                    type="text" 
                                    value={address.building}
                                    onChange={(e) => handleAddressChange("building", e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Street / Road</label>
                                <input 
                                    type="text" 
                                    value={address.street}
                                    onChange={(e) => handleAddressChange("street", e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Area / Locality</label>
                                <input 
                                    type="text" 
                                    value={address.area}
                                    onChange={(e) => handleAddressChange("area", e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">City</label>
                                <input 
                                    type="text" 
                                    value={address.city}
                                    onChange={(e) => handleAddressChange("city", e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">State</label>
                                <input 
                                    type="text" 
                                    value={address.state}
                                    onChange={(e) => handleAddressChange("state", e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Pincode</label>
                                <input 
                                    type="text" 
                                    value={address.pincode}
                                    onChange={(e) => handleAddressChange("pincode", e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Operational Timings */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <Clock className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-lg font-bold text-gray-900">Operational Timings</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {DAYS.map(day => {
                                const dayData = shopTiming[day] || { working: false, slots: [{open: "09:00", close: "18:00"}] };
                                const openTime = dayData.slots?.[0]?.open || "09:00";
                                const closeTime = dayData.slots?.[0]?.close || "18:00";

                                return (
                                    <div key={day} className="flex flex-col gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={dayData.working}
                                                        onChange={(e) => handleTimingChange(day, "working", e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                </div>
                                                <span className={`text-sm font-semibold capitalize ${dayData.working ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {day}
                                                </span>
                                            </label>
                                        </div>
                                        
                                        {dayData.working && (
                                            <div className="flex items-center gap-2 mt-2 pl-12">
                                                <input 
                                                    type="time" 
                                                    value={openTime}
                                                    onChange={(e) => handleTimingChange(day, "open", e.target.value)}
                                                    className="text-xs px-2 py-1.5 rounded-lg border border-gray-300 outline-none focus:ring-1 focus:ring-indigo-600"
                                                />
                                                <span className="text-xs text-gray-500 font-medium">to</span>
                                                <input 
                                                    type="time" 
                                                    value={closeTime}
                                                    onChange={(e) => handleTimingChange(day, "close", e.target.value)}
                                                    className="text-xs px-2 py-1.5 rounded-lg border border-gray-300 outline-none focus:ring-1 focus:ring-indigo-600"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
