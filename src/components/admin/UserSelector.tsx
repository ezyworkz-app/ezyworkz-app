"use client";

import { User } from "@/types/user";
import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

interface Props {
    users: User[];
    onSelect: (user: User) => void;
    onCreateNewUser?: (name: string, phone: string, email?: string) => Promise<User | null>;
}

export default function UserSelector({ users, onSelect, onCreateNewUser }: Props) {
    const [search, setSearch] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createPhone, setCreatePhone] = useState("");
    const [createEmail, setCreateEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const query = search.toLowerCase();

    const filtered = users.filter((u) => {
        const name = u.name?.toLowerCase() || "";
        const email = u.email?.toLowerCase() || "";
        const phone = u.phoneNumber || "";

        return (
            name.includes(query) ||
            email.includes(query) ||
            phone.includes(search)
        );
    });

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
                    className="flex-1 rounded-lg border border-gray-300 p-2 outline-none focus:border-purple-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {onCreateNewUser && !isCreating && (
                    <button
                        onClick={() => {
                            setIsCreating(true);
                            if (/^\d+$/.test(search)) {
                                setCreatePhone(search);
                            } else if (search.includes("@")) {
                                setCreateEmail(search);
                            } else {
                                setCreateName(search);
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                        <Plus size={18} />
                        New User
                    </button>
                )}
            </div>

            {isCreating && onCreateNewUser && (
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg space-y-3">
                    <h3 className="font-semibold text-purple-900">Create New User</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="Full Name *"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            className="rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:border-purple-500"
                        />
                        <input
                            type="tel"
                            placeholder="Phone Number *"
                            value={createPhone}
                            onChange={(e) => setCreatePhone(e.target.value)}
                            className="rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:border-purple-500"
                        />
                        <input
                            type="email"
                            placeholder="Email Address (optional)"
                            value={createEmail}
                            onChange={(e) => setCreateEmail(e.target.value)}
                            className="rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:border-purple-500 sm:col-span-2"
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={async () => {
                                if (!createName || !createPhone) {
                                    alert("Name and phone are required");
                                    return;
                                }
                                setIsSubmitting(true);
                                const newUser = await onCreateNewUser(createName, createPhone, createEmail);
                                setIsSubmitting(false);
                                if (newUser) {
                                    setIsCreating(false);
                                    setSearch("");
                                    onSelect(newUser);
                                }
                            }}
                            disabled={isSubmitting || !createName || !createPhone}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            Create & Select
                        </button>
                        <button
                            onClick={() => setIsCreating(false)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {!isCreating && (
                <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200">
                {filtered.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        No users found.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filtered.map((user) => (
                            <button
                                key={user.userId}
                                onClick={() => onSelect(user)}
                                className="flex w-full items-center justify-between p-3 hover:bg-purple-50 text-left transition"
                            >
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {user.name ?? "Unnamed User"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {[user.phoneNumber, user.email].filter(Boolean).join(" • ")}
                                    </div>
                                </div>
                                <div className="text-purple-600">Select →</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            )}
        </div>
    );
}
