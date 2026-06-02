"use client";

import { useState } from "react";
import apiClient from "@/lib/api/client";
import { Modal } from "@/components/ui/modal";
import { Loader2, Plus, Settings } from "lucide-react";
import AddCategoryModal from "./AddCategoryModal";
import AddItemModal from "./AddItemModal";

export function ServiceModalRenderer({
  modal,
  setModal,
  shopId,
  globalServices,
  shopServices,
  onRefresh,
}: any) {
  if (!modal) return null;

  const closeModal = () => setModal(null);

  switch (modal.type) {
    case "add-service":
      return <AddServiceModal shopId={shopId} globalServices={globalServices} shopServices={shopServices} closeModal={closeModal} onRefresh={onRefresh} />;
    case "edit-service":
      return <EditServiceModal shopId={shopId} service={modal.data} closeModal={closeModal} onRefresh={onRefresh} />;
    case "add-category":
      return <AddCategoryModal shopId={shopId} service={modal.data} closeModal={closeModal} onRefresh={onRefresh} />;
    case "add-item":
      return <AddItemModal shopId={shopId} service={modal.data.service} category={modal.data.category} closeModal={closeModal} onRefresh={onRefresh} />;
    case "edit-item":
      return <EditItemModal shopId={shopId} data={modal.data} closeModal={closeModal} onRefresh={onRefresh} />;
    default:
      return null;
  }
}

function AddServiceModal({ shopId, globalServices, shopServices, closeModal, onRefresh }: any) {
  const [selectedId, setSelectedId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter out services already added
  const availableServices = globalServices.filter(
    (gs: any) => !shopServices.some((ss: any) => ss.globalServiceId === gs.globalServiceId)
  );

  const [deliveryTypes, setDeliveryTypes] = useState({
    express: { priceMultiplier: "2", duration: "4-8 hrs" },
    oneDay: { priceMultiplier: "1.5", duration: "16-24 hrs" },
    standard: { priceMultiplier: "1", duration: "48-72 hrs" },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    setSubmitting(true);
    try {
      const globalSvc = globalServices.find((g: any) => g.globalServiceId === selectedId);
      await apiClient.post(`/shops/${shopId}/services`, {
        globalServiceId: selectedId,
        name: globalSvc?.name || "New Service",
        deliveryTypes: Object.fromEntries(
          Object.entries(deliveryTypes).map(([k, v]) => [k, { ...v, priceMultiplier: parseFloat(v.priceMultiplier) }])
        ),
      });
      onRefresh();
      closeModal();
    } catch (err: any) {
      alert("Failed to create service: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={closeModal}>
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="text-xl font-bold text-white mb-2">Add New Service</h2>
        <p className="text-sm text-slate-400 mb-6">Map a global service template to your shop.</p>

        {availableServices.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700">
            You have already added all available services.
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Select Template</label>
              <select
                required
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-[#0e1424] border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              >
                <option value="">Choose a service...</option>
                {availableServices.map((gs: any) => (
                  <option key={gs.globalServiceId} value={gs.globalServiceId}>
                    {gs.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Settings size={16} /> Default Delivery Settings
              </h3>
              {(["express", "oneDay", "standard"] as const).map((type) => (
                <div key={type} className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <div className="col-span-2">
                    <span className="text-sm font-bold capitalize text-white">{type.replace(/([A-Z])/g, " $1")}</span>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={deliveryTypes[type].priceMultiplier}
                      onChange={(e) => setDeliveryTypes(p => ({ ...p, [type]: { ...p[type], priceMultiplier: e.target.value } }))}
                      className="w-full bg-[#0e1424] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Duration</label>
                    <input
                      type="text"
                      required
                      value={deliveryTypes[type].duration}
                      onChange={(e) => setDeliveryTypes(p => ({ ...p, [type]: { ...p[type], duration: e.target.value } }))}
                      className="w-full bg-[#0e1424] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-slate-400 font-medium hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button disabled={submitting || !selectedId} type="submit" className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#0e1424] font-bold disabled:opacity-50 flex items-center gap-2 transition-colors">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Map Service
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

function EditServiceModal({ shopId, service, closeModal, onRefresh }: any) {
    const [submitting, setSubmitting] = useState(false);
    const [deliveryTypes, setDeliveryTypes] = useState<any>(
        service.deliveryTypes || {
            express: { priceMultiplier: 2, duration: "4-8 hrs" },
            oneDay: { priceMultiplier: 1.5, duration: "16-24 hrs" },
            standard: { priceMultiplier: 1, duration: "48-72 hrs" },
        }
    );
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        await apiClient.put(`/shops/${shopId}/services/${service.serviceID}`, {
          deliveryTypes: Object.fromEntries(
            Object.entries(deliveryTypes).map(([k, v]: any) => [k, { ...v, priceMultiplier: parseFloat(v.priceMultiplier) }])
          ),
        });
        onRefresh();
        closeModal();
      } catch (err: any) {
        alert("Failed to update service: " + err.message);
      } finally {
        setSubmitting(false);
      }
    };
  
    return (
      <Modal isOpen onClose={closeModal}>
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">Edit {service.name}</h2>
          <p className="text-sm text-slate-400 mb-6">Update delivery multipliers for this service.</p>
  
          <div className="mb-6 space-y-4">
            {(["express", "oneDay", "standard"] as const).map((type) => (
              <div key={type} className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div className="col-span-2">
                  <span className="text-sm font-bold capitalize text-white">{type.replace(/([A-Z])/g, " $1")}</span>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={deliveryTypes[type]?.priceMultiplier ?? ""}
                    onChange={(e) => setDeliveryTypes((p: any) => ({ ...p, [type]: { ...p[type], priceMultiplier: e.target.value } }))}
                    className="w-full bg-[#0e1424] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Duration</label>
                  <input
                    type="text"
                    required
                    value={deliveryTypes[type]?.duration ?? ""}
                    onChange={(e) => setDeliveryTypes((p: any) => ({ ...p, [type]: { ...p[type], duration: e.target.value } }))}
                    className="w-full bg-[#0e1424] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
  
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-slate-400 font-medium hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button disabled={submitting} type="submit" className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#0e1424] font-bold disabled:opacity-50 flex items-center gap-2 transition-colors">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    );
  }

function EditItemModal({ shopId, data, closeModal, onRefresh }: any) {
  const { service, category, item } = data;
  const [submitting, setSubmitting] = useState(false);
  const [price, setPrice] = useState(item.price ?? item.pricePerPiece ?? 0);
  const [variants, setVariants] = useState<any[]>(item.variants || []);

  const hasVariants = variants.length > 0 && !(variants.length === 1 && variants[0].name?.toLowerCase() === 'default');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        name: item.itemName || item.name,
      };

      if (hasVariants) {
        payload.variants = variants.map(v => ({ ...v, price: parseFloat(v.price) }));
      } else {
        payload.price = parseFloat(price.toString());
      }

      await apiClient.put(
        `/shops/${shopId}/services/${service.serviceID}/categories/${category.categoryId}/items/${item.shopServiceCategoryItemId || item.id}`,
        payload
      );
      onRefresh();
      closeModal();
    } catch (err: any) {
      alert("Failed to update item: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={closeModal}>
      <form onSubmit={handleSubmit} className="p-6 max-w-md">
        <h2 className="text-xl font-bold text-white mb-2">Edit Price</h2>
        <p className="text-sm text-slate-400 mb-6">{item.itemName || item.name}</p>

        {hasVariants ? (
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-300">Variant Prices</h3>
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-slate-400 capitalize">{v.name}</span>
                <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                    <input
                        type="number"
                        required
                        value={v.price}
                        onChange={(e) => {
                            const newV = [...variants];
                            newV[i].price = e.target.value;
                            setVariants(newV);
                        }}
                        className="w-full bg-[#0e1424] border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white focus:border-teal-500 outline-none"
                    />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Base Price</label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#0e1424] border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-lg font-bold focus:border-teal-500 outline-none"
                />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
          <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-slate-400 font-medium hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button disabled={submitting} type="submit" className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#0e1424] font-bold disabled:opacity-50 flex items-center gap-2 transition-colors">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Save Price
          </button>
        </div>
      </form>
    </Modal>
  );
}
