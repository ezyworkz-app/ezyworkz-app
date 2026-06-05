"use client";

import { useState, useEffect } from "react";
import {
  getUnusedGlobalCategories,
  createShopServiceCategory,
} from "@/lib/actions/shopServices";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { PlusCircle, Search, Layers } from "lucide-react";

interface Props {
  shopId: string;
  service: any;
  closeModal: () => void;
}

export default function AddCategoryModal({
  shopId,
  service,
  closeModal,
}: Props) {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const unused = await getUnusedGlobalCategories(shopId, service.serviceID);
      setCategories(unused);
      setLoading(false);
    })();
  }, [shopId, service?.serviceID]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;

    try {
      setSubmitting(true);
      await createShopServiceCategory(shopId, service.serviceID, {
        globalCategoryId: selectedId,
      });
      router.refresh();
      closeModal();
    } catch (err) {
      alert("Error adding category");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
      <p className="text-sm text-gray-500 font-medium">Loading categories...</p>
    </div>
  );

  if (categories.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-300">
          <Layers size={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">All categories added</h3>
          <p className="text-sm text-gray-500 mt-1">Every available category has already been added to this service.</p>
        </div>
        <Button onClick={closeModal} variant="outline" className="w-full py-3 rounded-xl">
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-white overflow-hidden">
      <div className="p-6 border-b bg-gray-50/50">
        <div className="flex items-center gap-3 justify-center mb-3">
          <Badge variant="secondary" className="px-3 py-1">Hierarchy</Badge>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-950 text-center">
          Add Category
        </h2>
        <p className="text-[10px] text-gray-400 text-center mt-1 uppercase tracking-widest font-black">
          Adding to <span className="text-brand-500">{service?.name}</span>
        </p>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-center space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Template Category</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-brand-500 transition-colors" size={18} />
            <select
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 outline-none transition-all appearance-none cursor-pointer"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
            >
              <option value="">Select a category to add...</option>
              {categories.map((c) => (
                <option key={c.globalCategoryId} value={c.globalCategoryId}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <PlusCircle size={16} />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-50 border border-brand-100 flex gap-3 italic">
          <div className="text-brand-500 mt-0.5"><Layers size={16} /></div>
          <p className="text-xs text-brand-700 leading-relaxed font-medium">
            Categories help organize your service items (dry clean, wash & fold, etc) and make navigation easier for customers.
          </p>
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
          {submitting ? "Processing" : "Add Category"}
        </Button>
      </div>
    </form>
  );
}
