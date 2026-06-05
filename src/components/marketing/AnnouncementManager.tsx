"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil, Trash2, Megaphone, CloudRain, TrendingUp, Tag, Info } from "lucide-react";
import {
    Announcement,
    AnnouncementType,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} from "@/lib/actions/announcements";

const TYPE_CONFIG: Record<AnnouncementType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
    delay:  { label: "Delay",  color: "text-blue-600",   bg: "bg-blue-50 border-blue-200",   Icon: CloudRain },
    surge:  { label: "Surge",  color: "text-amber-600",  bg: "bg-amber-50 border-amber-200",  Icon: TrendingUp },
    offer:  { label: "Offer",  color: "text-emerald-600",bg: "bg-emerald-50 border-emerald-200", Icon: Tag },
    info:   { label: "Info",   color: "text-purple-600", bg: "bg-purple-50 border-purple-200", Icon: Info },
};

const EMPTY = { type: "info" as AnnouncementType, title: "", message: "", isActive: "TRUE" as "TRUE" | "FALSE", expiresAt: "" };

interface Props { announcements: Announcement[] }

export default function AnnouncementManager({ announcements }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Announcement | null>(null);
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState("");

    const openCreate = () => { setEditing(null); setForm(EMPTY); setError(""); setOpen(true); };
    const openEdit = (a: Announcement) => {
        setEditing(a);
        setForm({ type: a.type, title: a.title, message: a.message, isActive: a.isActive, expiresAt: a.expiresAt?.slice(0, 16) ?? "" });
        setError("");
        setOpen(true);
    };
    const close = () => { setOpen(false); setEditing(null); setError(""); };

    const handleSave = () => {
        if (!form.title.trim() || !form.message.trim()) { setError("Title and message are required."); return; }
        startTransition(async () => {
            const payload = { ...form, expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined };
            const res = editing
                ? await updateAnnouncement(editing.announcementId, payload)
                : await createAnnouncement(payload);
            if (res.success) { close(); router.refresh(); }
            else setError(res.message || "Something went wrong.");
        });
    };

    const handleToggle = (a: Announcement) => {
        startTransition(async () => {
            await updateAnnouncement(a.announcementId, { isActive: a.isActive === "TRUE" ? "FALSE" : "TRUE" });
            router.refresh();
        });
    };

    const handleDelete = (a: Announcement) => {
        if (!confirm(`Delete "${a.title}"?`)) return;
        startTransition(async () => { await deleteAnnouncement(a.announcementId); router.refresh(); });
    };

    return (
        <>
            {/* Create Button */}
            <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-5 py-2.5 rounded-2xl transition-colors shadow-lg shadow-brand-500/30"
            >
                <Plus size={18} /> New Announcement
            </button>

            {/* Table */}
            <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                {announcements.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
                        <Megaphone size={40} strokeWidth={1.5} />
                        <p className="font-semibold">No announcements yet</p>
                        <p className="text-sm">Create one to show alerts to users on the home screen.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 dark:border-white/5">
                            <tr className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                                <th className="text-left px-6 py-4">Type</th>
                                <th className="text-left px-6 py-4">Title</th>
                                <th className="text-left px-6 py-4 hidden md:table-cell">Message</th>
                                <th className="text-left px-6 py-4 hidden lg:table-cell">Expires</th>
                                <th className="text-left px-6 py-4">Status</th>
                                <th className="px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {announcements.map((a) => {
                                const cfg = TYPE_CONFIG[a.type];
                                return (
                                    <tr key={a.announcementId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
                                                <cfg.Icon size={12} />
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white max-w-[160px] truncate">{a.title}</td>
                                        <td className="px-6 py-4 text-gray-500 hidden md:table-cell max-w-[240px] truncate">{a.message}</td>
                                        <td className="px-6 py-4 text-gray-400 hidden lg:table-cell text-xs">
                                            {a.expiresAt ? new Date(a.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggle(a)}
                                                disabled={isPending}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${a.isActive === "TRUE" ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${a.isActive === "TRUE" ? "translate-x-6" : "translate-x-1"}`} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 justify-end">
                                                <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 transition-colors">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(a)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">
                                {editing ? "Edit Announcement" : "New Announcement"}
                            </h2>
                            <button onClick={close} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Type selector */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Type</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(Object.entries(TYPE_CONFIG) as [AnnouncementType, typeof TYPE_CONFIG[AnnouncementType]][]).map(([key, cfg]) => (
                                    <button
                                        key={key}
                                        onClick={() => setForm(f => ({ ...f, type: key }))}
                                        className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-xs font-bold transition-all ${form.type === key ? `${cfg.bg} ${cfg.color} border-current` : "border-gray-100 dark:border-white/5 text-gray-400 hover:border-gray-200"}`}
                                    >
                                        <cfg.Icon size={16} />
                                        {cfg.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Title</label>
                            <input
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. Rain delays expected"
                                maxLength={80}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Message</label>
                            <textarea
                                value={form.message}
                                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                placeholder="e.g. Heavy rain in Bengaluru — expect 30–60 min delays on pickups and deliveries."
                                rows={3}
                                maxLength={200}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                            />
                        </div>

                        {/* Expires At */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Expires At <span className="font-normal normal-case">(optional)</span></label>
                            <input
                                type="datetime-local"
                                value={form.expiresAt}
                                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                        </div>

                        {/* Active toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Active</p>
                                <p className="text-xs text-gray-400">Visible to users immediately when active</p>
                            </div>
                            <button
                                onClick={() => setForm(f => ({ ...f, isActive: f.isActive === "TRUE" ? "FALSE" : "TRUE" }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive === "TRUE" ? "bg-emerald-500" : "bg-gray-200"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive === "TRUE" ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>

                        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                        <div className="flex gap-3 pt-2">
                            <button onClick={close} className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="flex-1 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black transition-colors disabled:opacity-60"
                            >
                                {isPending ? "Saving…" : editing ? "Save Changes" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
