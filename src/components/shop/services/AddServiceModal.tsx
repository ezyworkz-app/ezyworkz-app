"use client";

import { useState, useEffect } from "react";
import {
  createShopService,
  getUnusedGlobalServices,
} from "@/lib/actions/shopServices";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Clock, Tag, Globe, Puzzle } from "lucide-react";

export default function AddServiceModal({
  shopId,
  closeModal,
}: {
  shopId: string;
  closeModal: () => void;
}) {
  const router = useRouter();
  const [globalServices, setGlobalServices] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [deliveryTypes, setDeliveryTypes] = useState({
    express: { priceMultiplier: "2", duration: "4–8 hrs" },
    oneDay: { priceMultiplier: "1.5", duration: "16–24 hrs" },
    standard: { priceMultiplier: "1", duration: "48–72 hrs" },
  });

  useEffect(() => {
    (async () => {
      const unused = await getUnusedGlobalServices(shopId);
      setGlobalServices(unused);
      setLoading(false);
    })();
  }, [shopId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;

    try {
      setSubmitting(true);
      await createShopService(shopId, {
        globalServiceId: selectedId,
        deliveryTypes: Object.fromEntries(
          Object.entries(deliveryTypes).map(([t, v]: any) => [
            t,
            { ...v, priceMultiplier: parseFloat(v.priceMultiplier) },
          ])
        ),
      });
      router.refresh();
      closeModal();
    } catch {
      alert("Error creating service");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
      <p className="text-sm text-gray-500 font-medium">Fetching available services...</p>
    </div>
  );

  if (globalServices.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-300">
          <Puzzle size={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">All services added</h3>
          <p className="text-sm text-gray-500 mt-1">There are no more global services available to add for this shop.</p>
        </div>
        <Button onClick={closeModal} variant="outline" className="w-full py-3 rounded-xl">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="p-6 border-b bg-gray-50/50">
        <div className="flex items-center gap-3 justify-center mb-3">
          <Badge variant="primary" className="px-3 py-1">New Service</Badge>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-950 text-center">
          Add Shop Service
        </h2>
        <p className="text-[10px] text-gray-400 text-center mt-1 uppercase tracking-widest font-black">
          Select a global service template to get started
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Service Selection Card */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Select Template</label>
          <div className="relative group">
            <Puzzle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-brand-500 transition-colors" size={18} />
            <select
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 outline-none transition-all appearance-none cursor-pointer"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
            >
              <option value="">Choose a service type...</option>
              {globalServices.map((g) => (
                <option key={g.globalServiceId} value={g.globalServiceId}>
                  {g.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Delivery Options Section */}
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Globe size={14} className="text-brand-500" />
              Delivery Config
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">Defaults Applied</span>
          </div>
          
          <div className="grid gap-5">
            {(["express", "oneDay", "standard"] as const).map((type) => (
              <div key={type} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-brand-200 transition-all duration-200 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${
                      type === 'express' ? 'bg-orange-500' : type === 'oneDay' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></span>
                    <span className="text-sm font-black text-gray-800 capitalize tracking-tight">
                      {type.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <Badge variant="neutral" className="bg-gray-50 text-[9px] font-bold">Standard Rates</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Multiplier</label>
                    <div className="relative group/input">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover/input:text-brand-500 transition-colors" size={14} />
                      <input
                        type="number"
                        step="0.1"
                        value={deliveryTypes[type].priceMultiplier}
                        onChange={(e) =>
                          setDeliveryTypes((p) => ({
                            ...p,
                            [type]: { ...p[type], priceMultiplier: e.target.value },
                          }))
                        }
                        placeholder="1.0"
                        className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 outline-none transition-all bg-gray-50/30 hover:bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Est. Time</label>
                    <div className="relative group/input">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover/input:text-brand-500 transition-colors" size={14} />
                      <input
                        value={deliveryTypes[type].duration}
                        onChange={(e) =>
                          setDeliveryTypes((p) => ({
                            ...p,
                            [type]: { ...p[type], duration: e.target.value },
                          }))
                        }
                        placeholder="e.g. 24 hrs"
                        className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 outline-none transition-all bg-gray-50/30 hover:bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t bg-gray-50/50 flex items-center gap-4">
        <Button 
          variant="outline" 
          type="button"
          className="flex-1 bg-white border-gray-200 text-gray-700 font-bold hover:bg-gray-100 py-3.5 rounded-xl"
          onClick={closeModal}
        >
          Cancel
        </Button>
        <Button
          isLoading={submitting}
          type="submit"
          className="flex-[2] bg-brand-500 hover:bg-brand-600 text-white font-black py-3.5 rounded-xl shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all tracking-tight"
        >
          {submitting ? "Initializing Service" : "Create Service"}
        </Button>
      </div>
    </form>
  );
}
