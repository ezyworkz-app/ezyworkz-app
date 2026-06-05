"use client";

import React, { useState } from "react";
import { Shop, ShopStatus } from "@/types/Shop";
import { updateShopStatus, updateShopAvailability, updateShopDetails, uploadShopFile } from "@/lib/actions/shops";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Input from "../ui/Input";
import { Save, AlertCircle, Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ShopInfoProps {
  shop: Shop;
}

const STATUS_OPTIONS = [
  { value: "in_progress", label: "In Progress" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "suspended", label: "Suspended" },
];

export default function ShopInfoSection({ shop }: ShopInfoProps) {
  const [isOpen, setIsOpen] = useState(shop.isOpen ?? false);
  const [status, setStatus] = useState<ShopStatus>(shop.status);
  const [phone, setPhone] = useState(shop.phone ?? "");
  const [alternatePhone, setAlternatePhone] = useState(shop.alternatePhone ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadShopFile(shop.shopId, file, "image");
      if (!res.success) {
        throw new Error(res.error || "Failed to upload image");
      }
      
      // Successfully uploaded!
      router.refresh();
      alert("Shop image updated successfully");
    } catch (error: any) {
      console.error("[handleImageUpload]", error);
      alert(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting the same file again if needed
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update Status if changed
      if (status !== shop.status) {
        const formData = new FormData();
        formData.append("shopId", shop.shopId);
        formData.append("shopStatus", status);
        const res = await updateShopStatus(formData);
        if (res.error) throw new Error(res.error);
      }

      // Update Availability if changed
      if (isOpen !== shop.isOpen) {
        const res = await updateShopAvailability(shop.shopId, { isOpen });
        if (!res.success) throw new Error(res.error);
      }

      // Update Phone or Alternate Phone if changed
      if (phone !== (shop.phone ?? "") || alternatePhone !== (shop.alternatePhone ?? "")) {
        const res = await updateShopDetails(shop.shopId, { 
          phone, 
          alternatePhone 
        });
        if (!res.success) throw new Error(res.error);
      }

      alert("Shop information updated successfully");
    } catch (error: any) {
      alert(error.message || "Failed to update shop info");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = 
    isOpen !== shop.isOpen || 
    status !== shop.status || 
    phone !== (shop.phone ?? "") || 
    alternatePhone !== (shop.alternatePhone ?? "");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 relative group">
          <div className="w-48 h-48 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center overflow-hidden transition-all group-hover:border-brand-500/50">
            {shop.imageUrl ? (
              <img
                src={shop.imageUrl}
                alt={shop.name}
                className={`w-full h-full object-cover transition-opacity ${isUploading ? "opacity-30" : "opacity-100"}`}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Camera size={32} strokeWidth={1.5} />
                <span className="text-[10px] font-medium uppercase tracking-wider">No Image</span>
              </div>
            )}

            {/* Loading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-[2px]">
                <Loader2 size={24} className="animate-spin text-brand-500" />
              </div>
            )}
            
            {/* Hover Action */}
            {!isUploading && (
              <label 
                htmlFor="shop-image-upload" 
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
              >
                <Camera size={24} />
                <span className="text-[10px] mt-1 font-bold uppercase tracking-widest">Change</span>
              </label>
            )}
          </div>
          
          <input 
            type="file" 
            id="shop-image-upload" 
            className="hidden" 
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
          
          <p className="text-[10px] text-gray-400 mt-2 text-center font-medium italic">
            Recommended: 500x500px (Max 5MB)
          </p>
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{shop.email}</p>
            </div>
            <div>
              <Input
                id="shop-phone"
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Shop phone number"
              />
            </div>
            <div>
              <Input
                id="shop-whatsapp"
                label="Alternate Phone (WhatsApp)"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                placeholder="Alternate phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-4">
              <Select
                id="shop-status"
                label="Shop Status"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(val) => setStatus(val as ShopStatus)}
              />
              
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-md border">
                <input
                  type="checkbox"
                  id="isOpen"
                  checked={isOpen}
                  onChange={(e) => setIsOpen(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="isOpen" className="text-sm font-medium text-gray-900 cursor-pointer block">
                    Shop Active (Receiving Orders)
                  </label>
                  <p className="text-xs text-gray-500">
                    Instantly toggle if the shop is accepting new orders.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              {hasChanges && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4 flex gap-2 items-start">
                  <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    You have unsaved changes in shop status or activity.
                  </p>
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="w-full flex items-center justify-center gap-2"
              >
                {isSaving ? "Saving..." : <><Save size={18} /> Save Changes</>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-gray-500">Description</p>
        <p className="text-gray-700 mt-1">
          {shop.description || "No description provided."}
        </p>
      </div>
    </div>
  );
}
