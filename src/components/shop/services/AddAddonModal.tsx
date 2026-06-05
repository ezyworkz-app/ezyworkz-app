"use client";

import { useEffect, useState } from "react";
import { getUnusedGlobalAddons, createShopAddon } from "@/lib/actions/shopServices";
import Button from "@/components/ui/Button";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/Badge";
import { Search, Plus, Loader2 } from "lucide-react";

interface Props {
  shopId: string;
  serviceId: string;
  closeModal: () => void;
  onSuccess?: () => void;
}

export default function AddAddonModal({ shopId, serviceId, closeModal, onSuccess }: Props) {
  const [loading, setLoading] = useState(true);
  const [unusedAddons, setUnusedAddons] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getUnusedGlobalAddons(shopId, serviceId);
        setUnusedAddons(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [shopId, serviceId]);

  async function handleAdd(globalAddonId: string) {
    setCreatingId(globalAddonId);
    try {
      await createShopAddon(shopId, serviceId, {
        globalAddonId,
        price: null, // Initial price is null, user can edit later
        isActive: true,
      });
      setUnusedAddons((prev) => prev.filter((a) => a.globalAddonId !== globalAddonId));
      onSuccess?.();
    } catch (e: any) {
      alert(e.message || "Failed to add addon");
    } finally {
      setCreatingId(null);
    }
  }

  const filtered = unusedAddons.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[500px] bg-white">
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Add Global Addon</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
            placeholder="Search global addons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            {search ? "No matches found" : "All global addons already added"}
          </div>
        ) : (
          filtered.map((addon) => (
            <div
              key={addon.globalAddonId}
              className="flex items-center justify-between p-3 border rounded-xl hover:border-brand-200 hover:bg-brand-50/20 transition-all group"
            >
              <div>
                <p className="font-bold text-gray-900 text-sm">{addon.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {addon.required && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Required</Badge>}
                  {addon.applyMarkup && <Badge variant="neutral" className="text-[10px] px-1.5 py-0 bg-gray-100">Markup</Badge>}
                </div>
              </div>
              <Button
                size="sm"
                isLoading={creatingId === addon.globalAddonId}
                onClick={() => handleAdd(addon.globalAddonId)}
                className="bg-white border text-gray-700 hover:bg-brand-500 hover:text-white hover:border-brand-500 font-bold"
              >
                {!creatingId && <Plus size={14} className="mr-1" />}
                Add
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t bg-gray-50/50 flex justify-end">
        <Button variant="outline" onClick={closeModal} className="font-bold">
          Close
        </Button>
      </div>
    </div>
  );
}
