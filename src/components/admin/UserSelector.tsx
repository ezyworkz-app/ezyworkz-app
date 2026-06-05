"use client";

import { User } from "@/types/user";
import { useState } from "react";

interface Props {
    users: User[];
    onSelect: (user: User) => void;
}

export default function UserSelector({ users, onSelect }: Props) {
    const [search, setSearch] = useState("");

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
            <input
                type="text"
                placeholder="Search by name, phone, or email..."
                className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-purple-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

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
                                        {user.phoneNumber} • {user.email}
                                    </div>
                                </div>
                                <div className="text-purple-600">Select →</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
