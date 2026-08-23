"use client";

import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import type { Shop } from "@/types";
import { uploadShopAsset, updateShopDetails } from "@/lib/actions/shops";
import { Loader2, Upload, Save, CheckCircle2, Building2 } from "lucide-react";
import Image from "next/image";
import { formatAssetUrl, getRelativeUrl } from "@/utils/format";

export default function GeneralClient() {
    const { selectedShopId, selectedShop, isLoading: isShopLoading, refreshShop } = useShop();

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    // `|| {}` widened the type to `{}`, so every property read below became a
    // compile error. Partial<Shop> keeps the fields visible and optional.
    const shopData: Partial<Shop> = selectedShop ?? {};

    const [logoUrl, setLogoUrl] = useState<string>(shopData.logoUrl || "");
    const [faviconUrl, setFaviconUrl] = useState<string>(shopData.faviconUrl || "");
    const [name, setName] = useState(shopData.name || "");
    const [phone, setPhone] = useState(shopData.phone || "");
    const [description, setDescription] = useState(shopData.description || "");

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectedShop) {
            setLogoUrl(selectedShop.logoUrl || "");
            setFaviconUrl(selectedShop.faviconUrl || "");
            setName(selectedShop.name || "");
            setPhone(selectedShop.phone || "");
            setDescription(selectedShop.description || "");
        }
    }, [selectedShop]);

    const activeShopId = selectedShopId;

    const handleUpload = async (file: File, type: "logo" | "favicon") => {
        if (!activeShopId) return;
        const formData = new FormData();
        formData.append("asset", file);
        
        try {
            const result = await uploadShopAsset(activeShopId, formData);
            if (result.success && result.data?.url) {
                const uploadedUrl = result.data.url;

                if (type === "logo") setLogoUrl(uploadedUrl);
                if (type === "favicon") setFaviconUrl(uploadedUrl);

                const assetPayload: Record<string, string> = {};
                if (type === "logo") assetPayload.logoUrl = uploadedUrl;
                if (type === "favicon") assetPayload.faviconUrl = uploadedUrl;

                const saveResult = await updateShopDetails(activeShopId, assetPayload);
                if (saveResult.success) {
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
        if (!activeShopId) return;
        setIsSaving(true);
        setSaveMessage(null);

        const payload = {
            name,
            phone,
            description,
            logoUrl: getRelativeUrl(logoUrl),
            faviconUrl: getRelativeUrl(faviconUrl),
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
                        <h1 className="text-2xl font-bold text-gray-900">General Info</h1>
                        <p className="text-gray-500 mt-1">Manage your shop's basic information and logos.</p>
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
                </div>
            </main>
        </ProtectedRoute>
    );
}
