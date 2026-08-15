"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { editShopService, deleteShopAddon, editShopAddon } from "@/lib/actions/shopServices";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Clock, Tag, Globe, EyeOff, Eye, Plus, Trash2, Info } from "lucide-react";
import AddAddonModal from "./AddAddonModal";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

interface Props {
  shopId: string;
  service: any;
  closeModal: () => void;
}

export default function EditServiceModal({
  shopId,
  service,
  closeModal,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(service.isActive ?? true);
  const [addons, setAddons] = useState(service.addons || []);
  const { isOpen, openModal, closeModal: closeSubModal } = useModal();

  const DELIVERY_TYPES = ["express", "oneDay", "standard"] as const;

  const [delivery, setDelivery] = useState(() => {
    const existing = Object.fromEntries(
      Object.entries(service.deliveryTypes ?? {}).map(([k, v]: any) => [
        k,
        {
          priceMultiplier: v?.priceMultiplier?.toString?.() || "1",
          duration: v?.duration ?? "",
        },
      ])
    ) as Record<string, { priceMultiplier: string; duration: string }>;

    for (const t of DELIVERY_TYPES) {
      if (!existing[t]) {
        existing[t] = { priceMultiplier: "1", duration: "" };
      }
    }
    return existing;
  });

  const [deliveryEnabled, setDeliveryEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      DELIVERY_TYPES.map((t) => [t, Boolean(service.deliveryTypes?.[t])])
    )
  );

  function toggleDeliveryType(type: string, checked: boolean) {
    setDeliveryEnabled((p) => {
      const next = { ...p, [type]: checked };
      if (!Object.values(next).some(Boolean)) {
        alert("At least one delivery type must stay enabled.");
        return p;
      }
      return next;
    });
  }

  async function handleUpdate() {
    setSaving(true);
    try {
      const cleaned = Object.fromEntries(
        Object.entries(delivery)
          .filter(([k]) => deliveryEnabled[k])
          .map(([k, v]) => [
            k,
            {
              priceMultiplier: parseFloat(v.priceMultiplier),
              duration: v.duration,
            },
          ])
      );
      await editShopService(shopId, service.serviceID, {
        deliveryTypes: cleaned,
        isActive: isActive,
      });
      router.refresh();
      closeModal();
    } catch (e: any) {
      alert(e?.message || "Failed to update service");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAddon(addonId: string) {
    if (!confirm("Delete this addon?")) return;
    try {
      await deleteShopAddon(shopId, service.serviceID, addonId);
      setAddons((prev: any[]) => prev.filter((a) => a.shopServiceAddonId !== addonId));
    } catch (e: any) {
      alert(e.message || "Failed to delete addon");
    }
  }

  async function handleUpdateAddonPrice(addonId: string, price: string) {
    try {
      const p = price === "" ? null : parseFloat(price);
      await editShopAddon(shopId, service.serviceID, addonId, { price: p });
      setAddons((prev: any[]) =>
        prev.map((a) => (a.shopServiceAddonId === addonId ? { ...a, price: p, originalUnitPrice: p } : a))
      );
    } catch (e: any) {
      alert(e.message || "Failed to update price");
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-6 border-b bg-gray-50/50">
        <div className="flex items-center gap-3 justify-center">
          <Badge variant="secondary" className="px-3 py-1">Service Config</Badge>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-950 text-center mt-4">
          {service.name}
        </h2>
        <p className="text-[10px] text-gray-400 text-center font-mono mt-1 tracking-widest uppercase">
          {service.serviceID}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Toggle Card */}
        <div className={`p-4 rounded-xl border transition-all duration-300 ${
          isActive 
            ? "bg-brand-50/30 border-brand-100 ring-1 ring-brand-50" 
            : "bg-gray-50 border-gray-200"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isActive ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                {isActive ? <Eye size={18} /> : <EyeOff size={18} />}
              </div>
              <div>
                <p className="text-sm font-black text-gray-950 uppercase tracking-widest">Visibility</p>
                <p className="text-xs text-gray-500">
                  {isActive ? "Visible to all customers" : "Hidden from service menu"}
                </p>
              </div>
            </div>
            <Switch
              label=""
              defaultChecked={isActive}
              onChange={setIsActive}
            />
          </div>
        </div>

        {/* Delivery Options */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Globe size={14} className="text-brand-500" />
            Delivery Options
          </h3>
          
          <div className="grid gap-4">
            {DELIVERY_TYPES.map((t) => {
              const isOn = deliveryEnabled[t];
              return (
                <div
                  key={t}
                  className={`p-4 rounded-xl border bg-white shadow-sm transition-colors group ${
                    isOn ? "border-gray-100 hover:border-brand-100" : "border-gray-100 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-800 capitalize flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isOn ? "bg-brand-400" : "bg-gray-300"}`}></span>
                      {t}
                    </span>
                    <Switch
                      label=""
                      checked={isOn}
                      onChange={(checked) => toggleDeliveryType(t, checked)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-brand-400 transition-colors" size={14} />
                      <input
                        value={delivery[t]?.priceMultiplier}
                        disabled={!isOn}
                        onChange={(e) =>
                          setDelivery((p) => ({
                            ...p,
                            [t]: { ...p[t], priceMultiplier: e.target.value },
                          }))
                        }
                        placeholder="x1.5"
                        className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="relative flex-[1.5]">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-brand-400 transition-colors" size={14} />
                      <input
                        value={delivery[t]?.duration}
                        disabled={!isOn}
                        onChange={(e) =>
                          setDelivery((p) => ({
                            ...p,
                            [t]: { ...p[t], duration: e.target.value },
                          }))
                        }
                        placeholder="e.g. 24 Hours"
                        className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      <div className="p-6 border-t bg-gray-50/50 flex items-center gap-3">
        <Button 
          variant="outline" 
          className="flex-1 bg-white border-gray-200 text-gray-700 font-bold hover:bg-gray-100 py-3 rounded-xl"
          onClick={closeModal}
        >
          Cancel
        </Button>
        <Button
          isLoading={saving}
          className="flex-[2] py-3 rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all"
          onClick={handleUpdate}
        >
          {saving ? "Saving Changes" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
