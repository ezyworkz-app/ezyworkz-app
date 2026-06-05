"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteShopAddon, editShopAddon } from "@/lib/actions/shopServices";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Trash2, X, Plus, ChevronDown, ChevronUp, Tag } from "lucide-react";

interface Props {
  shopId: string;
  service: any; // TreeViewService
  closeModal: () => void;
  refresh: () => void;
}

export default function ManageAddonsModal({ shopId, service, closeModal, refresh }: Props) {
  const router = useRouter();
  const [addons, setAddons] = useState(service.addons || []);
  const [expandedAddons, setExpandedAddons] = useState<Record<string, boolean>>({});

  const toggleExpand = (addonId: string) => {
    setExpandedAddons(prev => ({ ...prev, [addonId]: !prev[addonId] }));
  };

  async function handleUpdateAddonPrice(addonId: string, newPrice: string) {
    if (newPrice === "") return;
    try {
      await editShopAddon(shopId, service.serviceID, addonId, {
        price: parseFloat(newPrice),
      });
      setAddons((prev: any) =>
        prev.map((a: any) =>
          a.shopServiceAddonId === addonId ? { ...a, price: parseFloat(newPrice) } : a
        )
      );
    } catch (e: any) {
      alert(e.message || "Failed to update price");
    } finally {
      refresh();
    }
  }

  async function handleToggleAddonStatus(addonId: string, currentStatus: boolean) {
    try {
      await editShopAddon(shopId, service.serviceID, addonId, {
        isActive: !currentStatus,
      });
      setAddons((prev: any) =>
        prev.map((a: any) =>
          a.shopServiceAddonId === addonId ? { ...a, isActive: !currentStatus } : a
        )
      );
    } catch (e: any) {
      alert(e.message || "Failed to toggle status");
    } finally {
      refresh();
    }
  }

  async function handleDeleteAddon(addonId: string) {
    if (!confirm("Are you sure you want to remove this addon?")) return;
    try {
      await deleteShopAddon(shopId, service.serviceID, addonId);
      setAddons((prev: any) => prev.filter((a: any) => a.shopServiceAddonId !== addonId));
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Failed to delete addon");
    }
  }

  async function handleUpdateVariations(addonId: string, variations: any[]) {
    try {
      await editShopAddon(shopId, service.serviceID, addonId, {
        variations: variations,
      });
      setAddons((prev: any) =>
        prev.map((a: any) =>
          a.shopServiceAddonId === addonId ? { ...a, variations } : a
        )
      );
    } catch (e: any) {
      alert(e.message || "Failed to update variations");
    } finally {
      refresh();
    }
  }

  const addVariation = (addonId: string) => {
    const addon = addons.find((a: any) => a.shopServiceAddonId === addonId);
    if (!addon) return;
    const variations = [...(addon.variations || [])];
    variations.push({ id: Date.now().toString(), name: "", price: 0 });
    handleUpdateVariations(addonId, variations);
  };

  const removeVariation = (addonId: string, variationId: string) => {
    const addon = addons.find((a: any) => a.shopServiceAddonId === addonId);
    if (!addon) return;
    const variations = (addon.variations || []).filter((v: any) => v.id !== variationId);
    handleUpdateVariations(addonId, variations);
  };

  const updateVariation = (addonId: string, variationId: string, field: string, value: any) => {
    const addon = addons.find((a: any) => a.shopServiceAddonId === addonId);
    if (!addon) return;
    const variations = (addon.variations || []).map((v: any) => 
      v.id === variationId ? { ...v, [field]: value } : v
    );
    handleUpdateVariations(addonId, variations);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-950">Manage Addons</h2>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-black">
            Service: <span className="text-brand-500">{service.name}</span>
          </p>
        </div>
        <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white scrollbar-hide">
        {addons.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
              <Plus size={32} />
            </div>
            <p className="text-sm font-medium text-gray-900">No addons yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Add addons from the service menu in the sidebar.</p>
          </div>
        ) : (
          addons.map((addon: any) => (
            <div 
              key={addon.shopServiceAddonId} 
              className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-brand-100 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-extrabold tracking-tight text-gray-950 truncate">
                        {addon.name}
                      </span>
                      {addon.required && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 flex items-center bg-brand-50 text-brand-600 border-none">
                          Required
                        </Badge>
                      )}
                    </div>
                    {addon.description && (
                      <p className="text-[10px] text-gray-500 line-clamp-1 italic">{addon.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAddonStatus(addon.shopServiceAddonId, addon.isActive)}
                      className="transition-transform active:scale-95"
                    >
                      <Badge variant={addon.isActive ? "success" : "neutral"} className={`h-6 px-2 cursor-pointer hover:opacity-80 transition-opacity text-[10px] ${addon.isActive ? 'text-white' : 'text-gray-600'}`}>
                        {addon.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                    <button 
                      onClick={() => handleDeleteAddon(addon.shopServiceAddonId)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Remove Addon"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  <div className="flex flex-1 items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[30px]">Base Price</label>
                    <div className="relative flex-1 group/input">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold group-focus-within/input:text-brand-500 transition-colors">₹</span>
                      <input
                        type="number"
                        defaultValue={addon.price ?? ""}
                        onBlur={(e) => handleUpdateAddonPrice(addon.shopServiceAddonId, e.target.value)}
                        placeholder="Set base price..."
                        className="w-full h-10 pl-7 pr-4 rounded-xl border border-gray-100 text-sm focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none bg-white transition-all font-bold placeholder:font-normal placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => toggleExpand(addon.shopServiceAddonId)}
                    className="flex items-center gap-2 px-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-xs font-bold text-gray-600"
                  >
                    <Tag size={14} />
                    Variations ({addon.variations?.length || 0})
                    {expandedAddons[addon.shopServiceAddonId] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Variations Section */}
                {expandedAddons[addon.shopServiceAddonId] && (
                  <div className="mt-4 pt-4 border-t border-dashed space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variations</h4>
                      <button 
                        onClick={() => addVariation(addon.shopServiceAddonId)}
                        className="flex items-center gap-1.5 text-[10px] font-extrabold text-brand-600 hover:bg-brand-50 px-2 py-1.5 rounded-lg transition-all border border-brand-100 hover:border-brand-200"
                      >
                        <Plus size={12} className="stroke-[3]" /> ADD VARIATION
                      </button>
                    </div>

                    <div className="space-y-2">
                       {(!addon.variations || addon.variations.length === 0) ? (
                         <p className="text-[10px] text-gray-400 italic text-center py-4 bg-gray-50/50 rounded-xl border border-dashed">
                           No variations added yet. Add variations for specific items (e.g. Shirt, Kurta).
                         </p>
                       ) : (
                         addon.variations.map((v: any) => (
                           <div key={v.id} className="flex gap-2 items-center group/var">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  defaultValue={v.name}
                                  onBlur={(e) => updateVariation(addon.shopServiceAddonId, v.id, "name", e.target.value)}
                                  placeholder="Variation name (e.g. Shirt)"
                                  className="w-full h-9 px-3 rounded-lg border border-gray-100 text-[11px] focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium"
                                />
                              </div>
                              <div className="w-24 relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">₹</span>
                                <input
                                  type="number"
                                  defaultValue={v.price}
                                  onBlur={(e) => updateVariation(addon.shopServiceAddonId, v.id, "price", parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-full h-9 pl-5 pr-2 rounded-lg border border-gray-100 text-[11px] focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold"
                                />
                              </div>
                              <button 
                                onClick={() => removeVariation(addon.shopServiceAddonId, v.id)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/var:opacity-100"
                              >
                                <Trash2 size={12} />
                              </button>
                           </div>
                         ))
                       )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-gray-50/50 flex justify-end gap-3">
        <Button 
          variant="primary"
          onClick={closeModal} 
          className="px-8 shadow-sm rounded-xl h-11 font-black uppercase tracking-widest bg-brand-500 hover:bg-brand-600 border-none text-white transition-all transform active:scale-95 text-[10px]"
        >
          Save & Close
        </Button>
      </div>
    </div>
  );
}
