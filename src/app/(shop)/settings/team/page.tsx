"use client";

import React from "react";
import ShopTeamSettings from "@/components/shop/team/ShopTeamSettings";
import { useShop } from "@/context/ShopContext";
import { Loader2 } from "lucide-react";

export default function ShopTeamSettingsPage() {
  const { selectedShopId, selectedShop, isLoading } = useShop();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!selectedShopId || !selectedShop) {
    return (
      <div className="p-6 text-center text-gray-500">
        No shop selected. Please select a shop from the sidebar.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          Team & Managers
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Assign store managers and manage access permissions for {selectedShop.name}.
        </p>
      </div>

      <ShopTeamSettings
        shopId={selectedShopId}
        shopName={selectedShop.name}
      />
    </div>
  );
}
