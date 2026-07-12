"use client";
import { UserCircle, Mail, Phone, Shield } from "lucide-react";
import { updateShopProfile } from "@/lib/actions/auth";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({ profile }: { profile: any }) {
    const [name, setName] = useState(profile?.name || "Shop Owner");
    const [phone, setPhone] = useState(profile?.phone || "");
    const email = profile?.email || "owner@ezyworkz.com";
    const role = "Shop Owner";
    
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage("");
        setError("");
        
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await updateShopProfile({ success: false, message: "" }, formData);
            if (res.success) {
                setMessage(res.message);
                router.refresh();
            } else {
                setError(res.message);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 max-w-3xl">
            <div className="flex items-center gap-6 mb-8 border-b border-gray-100 pb-8">
                <div className="h-24 w-24 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <UserCircle className="w-12 h-12 text-blue-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{name}</h2>
                    <p className="text-gray-500">{role}</p>
                </div>
            </div>

            {message && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl">{message}</div>}
            {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="flex items-center bg-white border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 rounded-xl px-4 py-3 transition-colors">
                        <UserCircle className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                        <input 
                            type="text" 
                            name="name"
                            className="bg-transparent border-none outline-none w-full text-gray-900 font-medium" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address (Read-only)</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 opacity-80 cursor-not-allowed">
                        <Mail className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                        <input type="email" className="bg-transparent border-none outline-none w-full text-gray-700 font-medium cursor-not-allowed" value={email} readOnly />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="flex items-center bg-white border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 rounded-xl px-4 py-3 transition-colors">
                        <Phone className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                        <input 
                            type="tel" 
                            name="phone"
                            className="bg-transparent border-none outline-none w-full text-gray-900 font-medium" 
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="Enter phone number"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 opacity-80 cursor-not-allowed">
                        <Shield className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                        <input type="text" className="bg-transparent border-none outline-none w-full text-gray-700 font-medium cursor-not-allowed" value={role} readOnly />
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => router.refresh()} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                    Reset
                </button>
                <button type="submit" disabled={isPending} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {isPending ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </form>
    );
}
