"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { getShopKyc, updateShopBankDetails, updateShopUpiDetails, uploadShopFile } from "@/lib/actions/shops";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { ShopKyc, BankDetails, UpiDetails } from "@/types/Shop";
import {
  Loader2, QrCode, Building2, CreditCard, User, Hash, Landmark,
  Upload, Image as ImageIcon, ExternalLink, Edit2, CheckCircle2, X, Info,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

interface BankDetailsEditorProps {
  shopId: string;
}

export default function BankDetailsEditor({ shopId }: BankDetailsEditorProps) {
  const [kyc, setKyc] = useState<ShopKyc | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountHolderName: "", bankAccountNumber: "", bankIfscCode: "", bankName: "", bankBranch: "",
  });
  const [upiDetails, setUpiDetails] = useState<UpiDetails>({ upiId: "", upiQrCodeUrl: "" });

  const fetchKyc = useCallback(async () => {
    setIsLoading(true);
    const data = await getShopKyc(shopId);
    if (data) {
      setKyc(data);
      if (data.bankDetails) setBankDetails(data.bankDetails);
      if (data.upiDetails) setUpiDetails(data.upiDetails);
    }
    setIsLoading(false);
  }, [shopId]);

  useEffect(() => { fetchKyc(); }, [fetchKyc]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    setIsUploading(true);
    try {
      const res = await uploadShopFile(shopId, acceptedFiles[0], "upiQrCode");
      if (res.success && res.data?.fileUrl) setUpiDetails((p) => ({ ...p, upiQrCodeUrl: res.data.fileUrl }));
      else alert("Upload failed: " + (res.error || "Unknown error"));
    } catch { alert("Failed to upload image."); }
    finally { setIsUploading(false); }
  }, [shopId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [] }, multiple: false, disabled: !isEditing,
  });

  const saveAllDetails = () => {
    startTransition(async () => {
      const bankRes = await updateShopBankDetails(shopId, bankDetails);
      const upiRes = await updateShopUpiDetails(shopId, upiDetails);
      if (bankRes.success && upiRes.success) {
        await fetchKyc();
        setIsEditing(false);
      } else {
        alert("Errors: " + (bankRes.error || "") + " " + (upiRes.error || ""));
      }
    });
  };

  const cancelEditing = () => {
    if (kyc) {
      if (kyc.bankDetails) setBankDetails(kyc.bankDetails);
      if (kyc.upiDetails) setUpiDetails(kyc.upiDetails);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <Loader2 className="animate-spin text-brand-500" size={24} />
        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading payout details…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Payout & Settlements</h3>
          <p className="text-xs font-medium text-gray-400 mt-0.5">Bank account and UPI details for shop settlements</p>
        </div>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}
            className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-4">
            <Edit2 size={13} className="mr-2" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isPending}
              className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
              <X size={13} className="mr-1.5" /> Cancel
            </Button>
            <Button size="sm" onClick={saveAllDetails} disabled={isPending}
              className="bg-brand-500 hover:bg-brand-600 text-white">
              {isPending ? <Loader2 className="animate-spin mr-1.5" size={13} /> : <CheckCircle2 size={13} className="mr-1.5" />}
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bank + UPI */}
        <div className="lg:col-span-8 space-y-4">

          {/* Bank Section */}
          <div className={`p-6 rounded-2xl border transition-all ${isEditing ? "border-brand-200 dark:border-brand-700 bg-brand-50/20 dark:bg-brand-500/5" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"}`}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-xl">
                <Landmark size={18} className="text-brand-500" />
              </div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Bank Information</h4>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Account Holder Name" name="accountHolderName" value={bankDetails.accountHolderName} onChange={(e) => setBankDetails((p) => ({ ...p, [e.target.name]: e.target.value }))} placeholder="Full Name" leftIcon={<User size={14} />} />
                <Input label="Account Number" name="bankAccountNumber" value={bankDetails.bankAccountNumber} onChange={(e) => setBankDetails((p) => ({ ...p, [e.target.name]: e.target.value }))} placeholder="Account Number" leftIcon={<CreditCard size={14} />} />
                <Input label="IFSC Code" name="bankIfscCode" value={bankDetails.bankIfscCode} onChange={(e) => setBankDetails((p) => ({ ...p, [e.target.name]: e.target.value }))} placeholder="IFSC" leftIcon={<Hash size={14} />} />
                <Input label="Bank Name" name="bankName" value={bankDetails.bankName} onChange={(e) => setBankDetails((p) => ({ ...p, [e.target.name]: e.target.value }))} placeholder="Bank Name" leftIcon={<Building2 size={14} />} />
                <div className="md:col-span-2">
                  <Input label="Branch" name="bankBranch" value={bankDetails.bankBranch} onChange={(e) => setBankDetails((p) => ({ ...p, [e.target.name]: e.target.value }))} placeholder="Branch Name" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DetailItem label="Account Holder" value={bankDetails.accountHolderName} icon={<User size={12} />} />
                <DetailItem label="Account Number" value={bankDetails.bankAccountNumber} icon={<CreditCard size={12} />} />
                <DetailItem label="IFSC Code" value={bankDetails.bankIfscCode} icon={<Hash size={12} />} />
                <DetailItem label="Bank Name" value={bankDetails.bankName} icon={<Building2 size={12} />} />
                <div className="md:col-span-2">
                  <DetailItem label="Branch" value={bankDetails.bankBranch} icon={<Landmark size={12} />} />
                </div>
              </div>
            )}
          </div>

          {/* UPI Section */}
          <div className={`p-6 rounded-2xl border transition-all ${isEditing ? "border-indigo-200 dark:border-indigo-700 bg-indigo-50/20 dark:bg-indigo-500/5" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"}`}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                <QrCode size={18} className="text-indigo-500" />
              </div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">UPI Payments</h4>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <Input label="UPI ID (VPA)" name="upiId" value={upiDetails.upiId} onChange={(e) => setUpiDetails((p) => ({ ...p, [e.target.name]: e.target.value }))} placeholder="shopname@bank" leftIcon={<Hash size={14} />} />
                <Input label="QR Code URL" name="upiQrCodeUrl" value={upiDetails.upiQrCodeUrl} readOnly placeholder="Upload QR to update…" leftIcon={<ImageIcon size={14} />} />
              </div>
            ) : (
              <div className="space-y-3">
                <DetailItem label="Primary UPI ID" value={upiDetails.upiId} icon={<Hash size={12} />} highlight />
                {!upiDetails.upiId && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-warning-50 dark:bg-warning-500/10 border border-warning-100 dark:border-warning-500/20">
                    <Info size={13} className="text-warning-500 flex-shrink-0" />
                    <p className="text-xs text-warning-600 dark:text-warning-400 font-medium">No UPI ID provided. Please add one for easier settlements.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: QR Preview */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UPI QR Preview</h4>
              {upiDetails.upiQrCodeUrl && (
                <button onClick={() => window.open(upiDetails.upiQrCodeUrl, "_blank")}
                  className="text-brand-400 hover:text-brand-600 transition-colors">
                  <ExternalLink size={14} />
                </button>
              )}
            </div>

            {upiDetails.upiQrCodeUrl ? (
              <div className="group relative rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 aspect-square flex items-center justify-center">
                <img src={upiDetails.upiQrCodeUrl} alt="Shop UPI QR" className="max-w-full max-h-full object-contain p-4" />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                    <button {...getRootProps()} className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">
                      <input {...getInputProps()} /> Change Image
                    </button>
                    <p className="text-[10px] text-gray-300 mt-2">Drag & drop new file here</p>
                  </div>
                )}
              </div>
            ) : (
              <div {...getRootProps()}
                className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all ${isEditing ? "cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 bg-gray-50 dark:bg-gray-800" : "opacity-60 bg-gray-50 dark:bg-gray-800"} ${isDragActive ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 dark:border-gray-700"}`}>
                <input {...getInputProps()} />
                {isEditing ? (
                  <>
                    {isUploading ? <Loader2 className="animate-spin text-brand-500 mb-2" size={28} /> : <Upload className="text-gray-400 mb-2" size={28} />}
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{isUploading ? "Uploading…" : "Upload QR Image"}</p>
                    <p className="text-[10px] text-gray-400 mt-1">PNG, JPG accepted</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="text-gray-300 dark:text-gray-600 mb-2" size={32} />
                    <p className="text-xs text-gray-400 font-medium">No QR uploaded</p>
                  </>
                )}
              </div>
            )}

            <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Always verify the QR code before making any payout. Allow a few seconds after upload for the image to sync.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon, highlight = false }: { label: string; value?: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
        {icon}{label}
      </span>
      <p className={`text-sm font-semibold ${value ? (highlight ? "text-brand-600 dark:text-brand-400 font-bold" : "text-gray-800 dark:text-gray-200") : "text-gray-300 dark:text-gray-600 italic"}`}>
        {value || "Not specified"}
      </p>
    </div>
  );
}
