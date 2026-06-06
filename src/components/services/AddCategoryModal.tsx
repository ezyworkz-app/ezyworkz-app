"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api/client";
import { Layers, PlusCircle, Search } from "lucide-react";

interface Props {
  shopId: string;
  service: any;
  closeModal: () => void;
  onRefresh: () => void;
}

export default function AddCategoryModal({
  shopId,
  service,
  closeModal,
  onRefresh
}: Props) {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/global/categories");
        const allCategories = res.data.data || res.data || [];
        
        // Filter out categories already used in this service
        const usedIds = new Set((service.categories || []).map((c: any) => c.globalCategoryId));
        const unused = allCategories.filter((c: any) => !usedIds.has(c.globalCategoryId));
        
        setCategories(unused);
      } catch (err) {
        console.error("Failed to fetch global categories", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [shopId, service]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;

    try {
      setSubmitting(true);
      const selectedCategory = categories.find(c => c.globalCategoryId === selectedId);
      await apiClient.post(`/shops/${shopId}/services/${service.shopServiceId || service.serviceID || service.id}/categories`, {
        globalCategoryId: selectedId,
        name: selectedCategory?.name || "Category",
        isActive: true,
      });
      onRefresh();
      closeModal();
    } catch (err: any) {
      alert(err.message || "Error adding category");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white p-12 rounded-xl flex flex-col items-center justify-center space-y-3 shadow-2xl">
        <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 font-medium">Loading categories...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 text-center">
            Add Category
          </h2>
          <p className="text-[10px] text-gray-500 text-center mt-1 uppercase tracking-widest font-bold">
            Adding to <span className="text-teal-600">{service?.name}</span>
          </p>
        </div>

        <div className="flex-1 p-6 flex flex-col justify-center space-y-6">
          {categories.length === 0 ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                <Layers size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">All categories added</h3>
                <p className="text-sm text-gray-500 mt-1">Every available category has already been added to this service.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Template Category</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-teal-500 transition-colors" size={18} />
                <select
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 bg-gray-100 text-sm text-gray-900 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a category to add...</option>
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
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center gap-4">
          <button 
            type="button"
            className="flex-1 bg-transparent border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 py-3 rounded-xl transition-colors"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || categories.length === 0}
            className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {submitting ? "Processing..." : "Add Category"}
          </button>
        </div>
      </form>
    </div>
  );
}
