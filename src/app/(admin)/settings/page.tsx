"use client";

import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import { uploadShopAsset, updateShopDetails } from "@/lib/actions/shops";
import { Loader2, Upload, Save, CheckCircle2, MapPin, Clock, Phone, Building2 } from "lucide-react";
import Image from "next/image";
import { formatAssetUrl, getRelativeUrl } from "@/utils/format";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function SettingsPage() {
    const { selectedShopId, selectedShop, isLoading: isShopLoading, refreshShop } = useShop();

    const [isSaving, setIsSaving] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string>("");
    const [faviconUrl, setFaviconUrl] = useState<string>("");
    const [googleAnalyticsId, setGoogleAnalyticsId] = useState<string>("");
    const [googleAdsId, setGoogleAdsId] = useState<string>("");
    const [googleAdsCheckoutLabel, setGoogleAdsCheckoutLabel] = useState<string>("");
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // Basic Details
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [description, setDescription] = useState("");

    // Address
    const [address, setAddress] = useState({
        building: "",
        street: "",
        area: "",
        city: "",
        state: "",
        pincode: ""
    });

    // Timings
    const [shopTiming, setShopTiming] = useState<any>({
        monday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        tuesday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        wednesday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        thursday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        friday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        saturday: { working: true, slots: [{ open: "09:00", close: "18:00" }] },
        sunday: { working: false, slots: [{ open: "09:00", close: "18:00" }] },
    });

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    // Sync local state with selectedShop whenever it changes
    const [initialized, setInitialized] = useState(false);
    
    useEffect(() => {
        if (!isShopLoading && selectedShop && !initialized) {
            setLogoUrl(selectedShop.logoUrl || "");
            setFaviconUrl(selectedShop.faviconUrl || "");
            setGoogleAnalyticsId(selectedShop.googleAnalyticsId || "");
            setGoogleAdsId(selectedShop.googleAdsId || "");
            setGoogleAdsCheckoutLabel(selectedShop.googleAdsCheckoutLabel || "");
            setName(selectedShop.name || "");
            setPhone(selectedShop.phone || "");
            setDescription(selectedShop.description || "");
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
                // Merge existing timings to avoid missing days
                setShopTiming((prev: any) => ({ ...prev, ...selectedShop.shopTiming }));
            }
            setInitialized(true);
        }
    }, [isShopLoading, selectedShop, initialized]);

    const handleUpload = async (file: File, type: "logo" | "favicon") => {
        if (!selectedShopId) return;
        const formData = new FormData();
        formData.append("asset", file);
        
        try {
            const result = await uploadShopAsset(selectedShopId, formData);
            if (result.success && result.data?.url) {
                const uploadedUrl = result.data.url;

                // Update local state for immediate preview
                if (type === "logo") setLogoUrl(uploadedUrl);
                if (type === "favicon") setFaviconUrl(uploadedUrl);

                // Auto-save the asset URL to the backend so it persists on refresh
                const assetPayload: Record<string, string> = {};
                if (type === "logo") assetPayload.logoUrl = uploadedUrl;
                if (type === "favicon") assetPayload.faviconUrl = uploadedUrl;

                const saveResult = await updateShopDetails(selectedShopId, assetPayload);
                if (saveResult.success) {
                    // Refresh shop context so other components (e.g. sidebar logo, favicon) stay in sync
                    await refreshShop();
                } else {
                    console.error(`[Settings] Failed to auto-save ${type} URL:`, saveResult.error);
                }
            } else {
                alert(`Upload failed: ${result.error}`);
            }
        } catch (err) {
            console.error(err);
            alert("Error uploading file.");
        }
    };

    const handleSave = async () => {
        if (!selectedShopId) return;
        setIsSaving(true);
        setSaveMessage(null);

        const payload = {
            name,
            phone,
            description,
            address,
            shopTiming,
            logoUrl: getRelativeUrl(logoUrl),
            faviconUrl: getRelativeUrl(faviconUrl),
            googleAnalyticsId,
            googleAdsId,
            googleAdsCheckoutLabel,
        };
        console.log("[Settings] Saving with payload:", JSON.stringify({ logoUrl: payload.logoUrl, faviconUrl: payload.faviconUrl }));

        const result = await updateShopDetails(selectedShopId, payload);
        console.log("[Settings] Save result:", JSON.stringify(result));

        setIsSaving(false);

        if (result.success) {
            setSaveMessage("Settings saved successfully!");
            // Re-fetch shop data so context (and favicon) stays in sync
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

    if (isShopLoading || !selectedShop) {
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
                        <h1 className="text-2xl font-bold text-gray-900">Shop Settings</h1>
                        <p className="text-gray-500 mt-1">Manage your shop's information, appearance, and preferences.</p>
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

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">
                    
                    {/* LEFT COLUMN */}
                    <div className="xl:col-span-2 space-y-8">
                        
                        {/* Basic Information */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <Building2 className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Shop Name</label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. The Laundry Studio"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                    <input 
                                        type="text" 
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. 9876543210"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Description</label>
                                    <textarea 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none h-24"
                                        placeholder="Briefly describe your services..."
                                    />
                                </div>
                            </div>
                        </div>

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
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-8">
                        
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

                        {/* Logos & Assets */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Logos & Assets</h3>
                            
                            <div className="space-y-6">
                                {/* Logo Settings */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Shop Logo</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden relative shrink-0">
                                            {logoUrl ? (
                                                <Image src={formatAssetUrl(logoUrl)} alt="Logo" fill className="object-contain p-2" unoptimized />
                                            ) : (
                                                <span className="text-gray-400 text-xs">No logo</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                ref={logoInputRef}
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) handleUpload(e.target.files[0], "logo");
                                                }}
                                            />
                                            <button 
                                                onClick={() => logoInputRef.current?.click()}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition text-gray-700"
                                            >
                                                <Upload className="w-4 h-4" /> Upload
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Favicon Settings */}
                                <div className="pt-6 border-t border-gray-100">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Favicon</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden relative shrink-0">
                                            {faviconUrl ? (
                                                <Image src={formatAssetUrl(faviconUrl)} alt="Favicon" fill className="object-contain p-1" unoptimized />
                                            ) : (
                                                <span className="text-gray-400 text-[10px] text-center px-1">None</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input 
                                                type="file" 
                                                accept="image/x-icon,image/png,image/jpeg" 
                                                ref={faviconInputRef}
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) handleUpload(e.target.files[0], "favicon");
                                                }}
                                            />
                                            <button 
                                                onClick={() => faviconInputRef.current?.click()}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition text-gray-700"
                                            >
                                                <Upload className="w-4 h-4" /> Upload
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analytics & Tracking */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Analytics & Tracking</h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Google Analytics Measurement ID</label>
                                    <input 
                                        type="text" 
                                        value={googleAnalyticsId}
                                        onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. G-XXXXXXXXXX"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Enter your Google Analytics Measurement ID (starts with "G-") to track visitors on your custom domain.
                                    </p>
                                </div>
                                <hr className="border-gray-100" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Google Ads Conversion ID</label>
                                    <input 
                                        type="text" 
                                        value={googleAdsId}
                                        onChange={(e) => setGoogleAdsId(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. AW-XXXXXXXXX"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Enter your Google Ads ID (starts with "AW-") to enable conversion tracking and remarketing on your custom domain.
                                    </p>
                                </div>
                                <hr className="border-gray-100" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Google Ads Checkout Conversion Label</label>
                                    <input 
                                        type="text" 
                                        value={googleAdsCheckoutLabel}
                                        onChange={(e) => setGoogleAdsCheckoutLabel(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. z01vCLyzwMUcEN664IZE"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Enter the specific conversion label for the "Begin checkout" or "Order placed" event to track successful checkouts in Google Ads.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
