"use client";

import { useMemo, useState, useEffect } from "react";
import apiClient from "@/lib/api/client";
import { Loader2, Search, Edit2, Plus, Trash2 } from "lucide-react";

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

  const handleDeleteItem = async (item: any) => {
    const id = item.shopServiceCategoryItemId || item.id || item.itemName;
    if (!id) return;
    if (!confirm("Are you sure you want to delete this item?")) return;

    setLoadingMap((m) => ({ ...m, [id]: true }));

    try {
      await apiClient.delete(
        `/shops/${shopId}/services/${service.serviceID}/categories/${selectedCategory.categoryId}/items/${id}`
      );
      onRefresh(); // trigger refetch
    } catch (err) {
      console.error("Failed to delete item", err);
      alert("Failed to delete item");
      setLoadingMap((m) => {
        const copy = { ...m };
        delete copy[id];
        return copy;
      });
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {selectedCategory.name}
            </h2>
            {selectedCategory.isActive === false ? (
              <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                Hidden
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-600 border border-teal-200 text-[10px] font-bold uppercase tracking-widest">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {items.length} items · {service?.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full sm:w-64 h-10 pl-9 pr-4 rounded-xl border border-gray-300 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"
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
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Base Price</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                    No items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => {
                  const id = item.shopServiceCategoryItemId || item.id || item.itemName;
                  const loading = loadingMap[id];
                  const hasVariants = item.variants && item.variants.length > 0 && !(item.variants.length === 1 && item.variants[0].name?.toLowerCase() === 'default');

                  return (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-gray-900">
                            {item.itemName || item.name || "Untitled"}
                          </span>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.tags.slice(0, 3).map((t: string, i: number) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
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
                            <span className="text-sm font-bold text-teal-600">
                                ₹{Math.min(...item.variants.map((v: any) => v.price))} - ₹{Math.max(...item.variants.map((v: any) => v.price))}
                            </span>
                            <span className="text-[10px] text-gray-500">{item.variants.length} variants</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-teal-600">
                            ₹{item.price ?? item.pricePerPiece ?? 0}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={loading}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            item.isActive ? 'bg-teal-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              item.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                          {loading && (
                            <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-gray-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
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
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            disabled={loading}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
