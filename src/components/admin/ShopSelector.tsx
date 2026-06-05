"use client";

import { Shop } from "@/types/Shop";
import { useState } from "react";

interface Props {
    shops: Shop[];
    onSelect: (shop: Shop) => void;
}

export default function ShopSelector({ shops, onSelect }: Props) {
    const [search, setSearch] = useState("");

    const filtered = shops.filter(
        (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.address?.area?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Search shops..."
                className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-purple-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((shop) => (
                    <button
                        key={shop.shopId}
                        onClick={() => onSelect(shop)}
                        className="flex flex-col items-start rounded-xl border border-gray-200 p-4 text-left transition hover:border-purple-500 hover:shadow-md"
                    >
                        <div className="mb-2 font-semibold text-gray-900">{shop.name}</div>
                        <div className="text-sm text-gray-500">
                            {shop.address?.area}, {shop.address?.city}
                        </div>
                        <div className="mt-2 text-xs text-purple-600">
                            {shop.status}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
