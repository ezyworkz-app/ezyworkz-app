"use client";

import { useMemo, useState, useEffect } from "react";
import apiClient from "@/lib/api/client";
import { Loader2, Search, Edit2, Plus } from "lucide-react";

export default function CategoryPanel({
  shopId,
  service,
  selectedCategory,
  setModal,
  onRefresh,
}: {
  shopId: string;
  service: any;
  selectedCategory: any;
  setModal: (modal: any) => void;
  onRefresh: () => void;
}) {
  const [query, setQuery] = useState("");
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const items = selectedCategory?.items || [];

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter((item: any) => {
      const name = (item.itemName || item.name || "").toLowerCase();
      const tags = (item.tags || []).join(" ").toLowerCase();
      return name.includes(q) || tags.includes(q);
    });
  }, [items, query]);

  const handleToggleStatus = async (item: any) => {
    const id = item.shopServiceCategoryItemId || item.id || item.itemName;
    if (!id) return;

    const newStatus = !item.isActive;
    setLoadingMap((m) => ({ ...m, [id]: true }));

    try {
      const payload: any = { isActive: newStatus };
      if (item.itemName || item.name) payload.name = item.itemName || item.name;

      await apiClient.put(
        `/shops/${shopId}/services/${service.serviceID}/categories/${selectedCategory.categoryId}/items/${id}`,
        payload
      );
      onRefresh(); // trigger refetch
    } catch (err) {
      console.error("Failed to toggle status", err);
      alert("Failed to toggle status");
    } finally {
      setLoadingMap((m) => {
        const copy = { ...m };
        delete copy[id];
        return copy;
      });
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-[#0e1424]">
      {/* Header */}
      <div className="p-6 border-b border-card-border bg-[#151c2f] flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {selectedCategory.name}
            </h2>
            {selectedCategory.isActive === false ? (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                Hidden
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/20 text-[10px] font-bold uppercase tracking-widest">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            {items.length} items · {service?.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full sm:w-64 h-10 pl-9 pr-4 rounded-xl border border-slate-700 bg-slate-800/50 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setModal({ type: "add-item", data: { service, category: selectedCategory } })}
            className="flex-shrink-0 h-10 px-4 inline-flex items-center justify-center rounded-xl bg-teal-500 text-sm font-bold text-white hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20"
          >
            <Plus size={16} className="mr-1.5" /> Add Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="bg-[#151c2f] rounded-2xl border border-card-border overflow-hidden">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-[#1a2235]">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Item</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Base Price</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => {
                  const id = item.shopServiceCategoryItemId || item.id || item.itemName;
                  const loading = loadingMap[id];
                  const hasVariants = item.variants && item.variants.length > 0 && !(item.variants.length === 1 && item.variants[0].name?.toLowerCase() === 'default');

                  return (
                    <tr key={id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-white">
                            {item.itemName || item.name || "Untitled"}
                          </span>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.tags.slice(0, 3).map((t: string, i: number) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {hasVariants ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-sm font-bold text-teal-400">
                                ₹{Math.min(...item.variants.map((v: any) => v.price))} - ₹{Math.max(...item.variants.map((v: any) => v.price))}
                            </span>
                            <span className="text-[10px] text-slate-500">{item.variants.length} variants</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-teal-400">
                            ₹{item.price ?? item.pricePerPiece ?? 0}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={loading}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            item.isActive ? 'bg-teal-500' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              item.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                          {loading && (
                            <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-slate-800" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() =>
                            setModal({
                              type: "edit-item",
                              data: {
                                service,
                                category: selectedCategory,
                                item,
                              },
                            })
                          }
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
