"use client";

import { useState, useRef } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useShop } from "@/context/ShopContext";
import { uploadShopAsset, updateShopDetails } from "@/lib/actions/shops";
import { Loader2, Upload, Save, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
    const { selectedShopId, selectedShop, isLoading: isShopLoading } = useShop();

    const [isSaving, setIsSaving] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string>("");
    const [faviconUrl, setFaviconUrl] = useState<string>("");
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    // Initialize local state when shop loads
    // We use a simple ref approach to avoid re-rendering loop, but useEffect could also work.
    const [initialized, setInitialized] = useState(false);
    if (!isShopLoading && selectedShop && !initialized) {
        setLogoUrl(selectedShop.logoUrl || "");
        setFaviconUrl(selectedShop.faviconUrl || "");
        setInitialized(true);
    }

    const handleUpload = async (file: File, type: "logo" | "favicon") => {
        if (!selectedShopId) return;
        const formData = new FormData();
        formData.append("asset", file);
        
        try {
            const result = await uploadShopAsset(selectedShopId, formData);
            if (result.success && result.data?.url) {
                const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${result.data.url}`;
                if (type === "logo") setLogoUrl(fullUrl);
                if (type === "favicon") setFaviconUrl(fullUrl);
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

        const result = await updateShopDetails(selectedShopId, {
            logoUrl,
            faviconUrl,
        });

        setIsSaving(false);

        if (result.success) {
            setSaveMessage("Settings saved successfully!");
            setTimeout(() => setSaveMessage(null), 3000);
        } else {
            alert(`Failed to save: ${result.error}`);
        }
    };

    if (isShopLoading || !initialized) {
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
            <main className="flex-1 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Shop Settings</h1>
                        <p className="text-gray-500 mt-1">Manage your shop's appearance and preferences.</p>
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
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium disabled:opacity-70"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo Settings */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop Logo</h3>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden relative">
                                {logoUrl ? (
                                    <Image src={logoUrl} alt="Logo" fill className="object-contain p-2" unoptimized />
                                ) : (
                                    <span className="text-gray-400 text-sm">No logo</span>
                                )}
                            </div>
                            <div>
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
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload Logo
                                </button>
                                <p className="text-xs text-gray-500 mt-2">Recommended size: 512x512px. Max 5MB.</p>
                            </div>
                        </div>
                    </div>

                    {/* Favicon Settings */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Favicon</h3>
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden relative">
                                {faviconUrl ? (
                                    <Image src={faviconUrl} alt="Favicon" fill className="object-contain p-2" unoptimized />
                                ) : (
                                    <span className="text-gray-400 text-xs text-center px-1">No favicon</span>
                                )}
                            </div>
                            <div>
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
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload Favicon
                                </button>
                                <p className="text-xs text-gray-500 mt-2">Recommended format: .ico or .png, 32x32px.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
