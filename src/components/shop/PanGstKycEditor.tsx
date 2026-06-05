"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    getShopKyc,
    updateShopPanDetails,
    updateShopGstKycDetails,
    uploadShopFile,
} from "@/lib/actions/shops";

/* ─── Types ─────────────────────────────────────────────────── */
interface PanDetails {
    panCardNumber: string;
    panCardImageUrl?: string;
}

interface GstKycDetails {
    gstNumber: string;
    gstCertificateUrl?: string;
}

interface Props {
    shopId: string;
}

/* ─── Helpers ────────────────────────────────────────────────── */
const PAN_REGEX  = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            {children}
        </p>
    );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex flex-col gap-0.5 py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                {value || <span className="text-gray-400 font-normal italic">Not set</span>}
            </span>
        </div>
    );
}

function UploadZone({
    label,
    currentUrl,
    uploading,
    onFile,
}: {
    label: string;
    currentUrl?: string;
    uploading: boolean;
    onFile: (file: File) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) onFile(file);
        },
        [onFile]
    );

    return (
        <div className="space-y-2">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">
                {label}
            </label>

            <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 cursor-pointer hover:border-brand-400 transition group"
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }}
                />

                {currentUrl ? (
                    <div className="w-full space-y-2">
                        {currentUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                            <img
                                src={currentUrl}
                                alt={label}
                                className="w-full max-h-40 object-contain rounded-xl border border-gray-100 dark:border-white/10"
                            />
                        ) : (
                            <a
                                href={currentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-2 text-sm text-brand-500 font-semibold underline"
                            >
                                📄 View uploaded document
                            </a>
                        )}
                        <p className="text-[11px] text-gray-400 text-center group-hover:text-brand-500 transition">
                            {uploading ? "Uploading…" : "Click or drag to replace"}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 text-xl">
                            {uploading ? "⏳" : "📎"}
                        </div>
                        <p className="text-sm text-gray-500">
                            {uploading ? "Uploading…" : "Click or drag to upload"}
                        </p>
                        <p className="text-xs text-gray-400">JPG, PNG or PDF</p>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function PanGstKycEditor({ shopId }: Props) {
    const [loading, setLoading]   = useState(true);
    const [editing, setEditing]   = useState<"pan" | "gst" | null>(null);

    // PAN state
    const [pan, setPan]         = useState<PanDetails>({ panCardNumber: "" });
    const [panDraft, setPanDraft] = useState<PanDetails>({ panCardNumber: "" });
    const [panUploading, setPanUploading] = useState(false);
    const [panSaving, setPanSaving]       = useState(false);
    const [panMsg, setPanMsg]   = useState<{ type: "success" | "error"; text: string } | null>(null);

    // GST KYC state
    const [gst, setGst]           = useState<GstKycDetails>({ gstNumber: "" });
    const [gstDraft, setGstDraft] = useState<GstKycDetails>({ gstNumber: "" });
    const [gstUploading, setGstUploading] = useState(false);
    const [gstSaving, setGstSaving]       = useState(false);
    const [gstMsg, setGstMsg]     = useState<{ type: "success" | "error"; text: string } | null>(null);

    /* Load KYC */
    useEffect(() => {
        getShopKyc(shopId).then(kyc => {
            if (kyc?.panDetails) {
                setPan(kyc.panDetails);
                setPanDraft(kyc.panDetails);
            }
            if (kyc?.gstDetails) {
                setGst(kyc.gstDetails);
                setGstDraft(kyc.gstDetails);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [shopId]);

    /* ── PAN handlers ──────────────────────────────────────────── */
    const handlePanFileUpload = async (file: File) => {
        setPanUploading(true);
        const res = await uploadShopFile(shopId, file, "panCard");
        if (res.success && res.data?.url) {
            setPanDraft(d => ({ ...d, panCardImageUrl: res.data.url }));
        }
        setPanUploading(false);
    };

    const savePan = async () => {
        if (!PAN_REGEX.test(panDraft.panCardNumber.toUpperCase())) {
            setPanMsg({ type: "error", text: "Invalid PAN format (e.g. ABCDE1234F)" });
            return;
        }
        setPanSaving(true);
        setPanMsg(null);
        const res = await updateShopPanDetails(shopId, {
            panCardNumber: panDraft.panCardNumber.toUpperCase().trim(),
            panCardImageUrl: panDraft.panCardImageUrl,
        });
        if (res.success) {
            setPan({ ...panDraft, panCardNumber: panDraft.panCardNumber.toUpperCase() });
            setEditing(null);
            setPanMsg({ type: "success", text: "PAN details saved." });
        } else {
            setPanMsg({ type: "error", text: res.error || "Failed to save." });
        }
        setPanSaving(false);
    };

    /* ── GST KYC handlers ─────────────────────────────────────── */
    const handleGstFileUpload = async (file: File) => {
        setGstUploading(true);
        const res = await uploadShopFile(shopId, file, "gstCertificate");
        if (res.success && res.data?.url) {
            setGstDraft(d => ({ ...d, gstCertificateUrl: res.data.url }));
        }
        setGstUploading(false);
    };

    const saveGst = async () => {
        if (!GSTIN_REGEX.test(gstDraft.gstNumber.toUpperCase())) {
            setGstMsg({ type: "error", text: "Invalid GSTIN format (e.g. 29ABCDE1234F1Z5)" });
            return;
        }
        setGstSaving(true);
        setGstMsg(null);
        const res = await updateShopGstKycDetails(shopId, {
            gstNumber: gstDraft.gstNumber.toUpperCase().trim(),
            gstCertificateUrl: gstDraft.gstCertificateUrl,
        });
        if (res.success) {
            setGst({ ...gstDraft, gstNumber: gstDraft.gstNumber.toUpperCase() });
            setEditing(null);
            setGstMsg({ type: "success", text: "GST details saved." });
        } else {
            setGstMsg({ type: "error", text: res.error || "Failed to save." });
        }
        setGstSaving(false);
    };

    const cancelEdit = (section: "pan" | "gst") => {
        if (section === "pan") { setPanDraft({ ...pan }); setPanMsg(null); }
        else                   { setGstDraft({ ...gst }); setGstMsg(null); }
        setEditing(null);
    };

    if (loading) {
        return <p className="text-sm text-gray-400 animate-pulse">Loading KYC details…</p>;
    }

    return (
        <div className="space-y-8 max-w-lg">

            {/* ── PAN Card ──────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <SectionTitle>PAN Card</SectionTitle>
                    {editing !== "pan" && (
                        <button
                            onClick={() => { setEditing("pan"); setPanMsg(null); setPanDraft({ ...pan }); }}
                            className="text-xs font-bold text-brand-500 hover:text-brand-600 transition"
                        >
                            {pan.panCardNumber ? "Edit" : "+ Add"}
                        </button>
                    )}
                </div>

                {editing === "pan" ? (
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-white/10">
                        {/* PAN Number */}
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                PAN Number
                            </label>
                            <input
                                type="text"
                                value={panDraft.panCardNumber}
                                onChange={e => setPanDraft(d => ({ ...d, panCardNumber: e.target.value.toUpperCase() }))}
                                placeholder="ABCDE1234F"
                                maxLength={10}
                                className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition uppercase ${
                                    panDraft.panCardNumber && !PAN_REGEX.test(panDraft.panCardNumber)
                                        ? "border-red-400 focus:ring-red-400/20"
                                        : "border-gray-200 dark:border-white/10 focus:ring-brand-500/20"
                                }`}
                            />
                            {panDraft.panCardNumber.length === 10 && PAN_REGEX.test(panDraft.panCardNumber) && (
                                <p className="text-xs text-emerald-500 mt-1">✓ Valid PAN format</p>
                            )}
                            {panDraft.panCardNumber && !PAN_REGEX.test(panDraft.panCardNumber) && (
                                <p className="text-xs text-red-500 mt-1">Invalid format — 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)</p>
                            )}
                        </div>

                        {/* PAN Image */}
                        <UploadZone
                            label="PAN Card Image"
                            currentUrl={panDraft.panCardImageUrl}
                            uploading={panUploading}
                            onFile={handlePanFileUpload}
                        />

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-1">
                            <button
                                onClick={savePan}
                                disabled={panSaving || panUploading}
                                className="px-5 py-2 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 disabled:opacity-50 transition"
                            >
                                {panSaving ? "Saving…" : "Save PAN"}
                            </button>
                            <button
                                onClick={() => cancelEdit("pan")}
                                className="px-5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                            >
                                Cancel
                            </button>
                            {panMsg && (
                                <span className={`text-sm font-semibold ${panMsg.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
                                    {panMsg.type === "success" ? "✓ " : "✗ "}{panMsg.text}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-white/5">
                        <DetailRow label="PAN Number" value={pan.panCardNumber} />
                        {pan.panCardImageUrl && (
                            <div className="mt-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PAN Card Image</span>
                                {pan.panCardImageUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                                    <img
                                        src={pan.panCardImageUrl}
                                        alt="PAN Card"
                                        className="mt-2 max-h-36 w-full object-contain rounded-xl border border-gray-100 dark:border-white/10"
                                    />
                                ) : (
                                    <a
                                        href={pan.panCardImageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 flex items-center gap-1.5 text-sm text-brand-500 font-semibold underline"
                                    >
                                        📄 View document
                                    </a>
                                )}
                            </div>
                        )}
                        {panMsg?.type === "success" && (
                            <p className="text-xs text-emerald-500 font-semibold mt-2">✓ {panMsg.text}</p>
                        )}
                    </div>
                )}
            </div>

            <div className="h-px bg-gray-100 dark:bg-white/5" />

            {/* ── GST Certificate ───────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <SectionTitle>GST Certificate</SectionTitle>
                    {editing !== "gst" && (
                        <button
                            onClick={() => { setEditing("gst"); setGstMsg(null); setGstDraft({ ...gst }); }}
                            className="text-xs font-bold text-brand-500 hover:text-brand-600 transition"
                        >
                            {gst.gstNumber ? "Edit" : "+ Add"}
                        </button>
                    )}
                </div>

                {editing === "gst" ? (
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-white/10">
                        {/* GSTIN */}
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                GSTIN
                            </label>
                            <input
                                type="text"
                                value={gstDraft.gstNumber}
                                onChange={e => setGstDraft(d => ({ ...d, gstNumber: e.target.value.toUpperCase() }))}
                                placeholder="29ABCDE1234F1Z5"
                                maxLength={15}
                                className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition uppercase ${
                                    gstDraft.gstNumber && !GSTIN_REGEX.test(gstDraft.gstNumber)
                                        ? "border-red-400 focus:ring-red-400/20"
                                        : "border-gray-200 dark:border-white/10 focus:ring-brand-500/20"
                                }`}
                            />
                            {gstDraft.gstNumber.length === 15 && GSTIN_REGEX.test(gstDraft.gstNumber) && (
                                <p className="text-xs text-emerald-500 mt-1">✓ Valid GSTIN format</p>
                            )}
                            {gstDraft.gstNumber && !GSTIN_REGEX.test(gstDraft.gstNumber) && (
                                <p className="text-xs text-red-500 mt-1">Invalid — 15 chars (e.g. 29ABCDE1234F1Z5)</p>
                            )}
                        </div>

                        {/* GST Certificate */}
                        <UploadZone
                            label="GST Registration Certificate"
                            currentUrl={gstDraft.gstCertificateUrl}
                            uploading={gstUploading}
                            onFile={handleGstFileUpload}
                        />

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-1">
                            <button
                                onClick={saveGst}
                                disabled={gstSaving || gstUploading}
                                className="px-5 py-2 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 disabled:opacity-50 transition"
                            >
                                {gstSaving ? "Saving…" : "Save GST"}
                            </button>
                            <button
                                onClick={() => cancelEdit("gst")}
                                className="px-5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                            >
                                Cancel
                            </button>
                            {gstMsg && (
                                <span className={`text-sm font-semibold ${gstMsg.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
                                    {gstMsg.type === "success" ? "✓ " : "✗ "}{gstMsg.text}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-white/5">
                        <DetailRow label="GSTIN" value={gst.gstNumber} />
                        {gst.gstCertificateUrl && (
                            <div className="mt-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Certificate</span>
                                {gst.gstCertificateUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                                    <img
                                        src={gst.gstCertificateUrl}
                                        alt="GST Certificate"
                                        className="mt-2 max-h-36 w-full object-contain rounded-xl border border-gray-100 dark:border-white/10"
                                    />
                                ) : (
                                    <a
                                        href={gst.gstCertificateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 flex items-center gap-1.5 text-sm text-brand-500 font-semibold underline"
                                    >
                                        📄 View certificate
                                    </a>
                                )}
                            </div>
                        )}
                        {gstMsg?.type === "success" && (
                            <p className="text-xs text-emerald-500 font-semibold mt-2">✓ {gstMsg.text}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
