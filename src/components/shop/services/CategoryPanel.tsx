import React, { useEffect, useMemo, useState } from "react";
import EditItemModal from "./EditItemModal";
import AddItemModal from "./AddItemModal";
import DeleteItemModal from "./DeleteItemModal";
import { editShopItem } from "@/lib/actions/shopServices";
import Badge from "@/components/ui/Badge";
import { applyMarkupAndGst, MarkupTier } from "@/utils/itemPricing";

type Item = {
  id?: string;
  shopServiceCategoryItemId?: string;
  itemName?: string;
  name?: string;
  description?: string;
  shortDescription?: string;
  tags?: string[];
  price?: number;
  pricePerPiece?: number;
  inclusiveGST?: boolean;
  isActive?: boolean;
  [k: string]: any;
};

export default function CategoryPanel({
  shopId,
  service,
  selectedCategory,
  setModal,
  onToggleItemStatus,
  gstEnabled = false,
  gstRate = 18,
  markupTiers = [],
}: {
  shopId: string;
  service: any;
  selectedCategory: any;
  setModal: (modal: any) => void;
  onToggleItemStatus?: (itemId: string, newStatus: boolean) => Promise<void> | void;
  gstEnabled?: boolean;
  gstRate?: number;
  markupTiers?: MarkupTier[];
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>(selectedCategory?.items ?? []);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const tiers = markupTiers ?? [];
  const calcPrice = (base: number) => applyMarkupAndGst(base, tiers, gstEnabled ?? false, gstRate ?? 18);

  useEffect(() => {
    setItems(selectedCategory?.items ?? []);
  }, [selectedCategory]);

  if (!selectedCategory) {
    return (
      <main className="flex-1 p-6 text-gray-500 text-center pt-12">
        Select a category to view its items.
      </main>
    );
  }

  const normalize = (s: any) =>
    s === undefined || s === null ? "" : String(s).toLowerCase();

  const filteredItems = useMemo(() => {
    const q = normalize(query).trim();
    if (!q) return items ?? [];

    return (items ?? []).filter((item: Item) => {
      const name = normalize(item.itemName ?? item.name);
      const desc = normalize(item.description ?? item.shortDescription ?? "");
      const tags = normalize((item.tags || []).join(" "));
      return name.includes(q) || desc.includes(q) || tags.includes(q);
    });
  }, [items, query]);

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);
    return (
      <>
        {before}
        <mark className="bg-amber-100 text-amber-800 rounded px-1">
          {match}
        </mark>
        {after}
      </>
    );
  };

  const getKey = (item: Item) =>
    item.shopServiceCategoryItemId ?? item.id ?? item.itemName ?? item.name;

  const handleToggleStatus = async (item: Item) => {
    const id = getKey(item);
    if (!id) return;

    const current = Boolean(item.isActive);
    const newStatus = !current;

    // Optimistic update
    setItems((prev) =>
      prev.map((it) => {
        if (getKey(it) === id) return { ...it, isActive: newStatus };
        return it;
      })
    );

    // set loading
    setLoadingMap((m) => ({ ...m, [String(id)]: true }));

    try {
      const updatePayload: any = {
        isActive: newStatus,
      };

      const itemName = item.itemName || item.name;
      if (itemName) updatePayload.name = itemName;
      if (item.unit) updatePayload.unit = item.unit;

      await editShopItem(
        shopId,
        service.serviceID,
        selectedCategory.categoryId,
        String(id),
        updatePayload
      );
    } catch (err) {
      // revert on error
      setItems((prev) =>
        prev.map((it) => {
          if (getKey(it) === id) return { ...it, isActive: current };
          return it;
        })
      );
      console.error("Failed to update item status", err);
      alert("Failed to update item status. Try again.");
    } finally {
      setLoadingMap((m) => {
        const copy = { ...m };
        delete copy[String(id)];
        return copy;
      });
    }
  };

  return (
    <main className="flex-1 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-slate-900">
              {selectedCategory.name}
            </h2>
            {selectedCategory.isActive === false ? (
              <Badge variant="neutral" className="bg-gray-100 text-gray-400 border-none font-bold">
                HIDDEN
              </Badge>
            ) : (
              <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-none font-bold">
                ACTIVE
              </Badge>
            )}
            {gstEnabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wide">
                GST {gstRate}% applied
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {(selectedCategory.items || []).length} items ·{" "}
            {service?.name ?? "Service"}
            {(tiers.length > 0 || gstEnabled) && (
              <span className="ml-2 text-amber-600 font-medium">
                · customer prices ={gstEnabled ? ` shop + ${gstRate}% GST` : " shop price"}
                {tiers.length > 0 ? " + markup" : ""}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items, tags or description..."
              className="w-64 md:w-96 px-3 py-2 rounded-lg border border-slate-200 bg-white shadow-sm text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Clear"
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={() =>
              setModal({
                type: "add-item",
                data: {
                  component: (props: any) => (
                    <AddItemModal
                      shopId={shopId}
                      service={service}
                      category={selectedCategory}
                      items={items}
                      closeModal={props.closeModal}
                    />
                  ),
                },
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-white sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                Item
              </th>
              {/* <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-medium text-slate-600 max-w-[36ch]">
                Description
              </th> */}
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                {gstEnabled
                  ? `Customer Price (shop + ${gstRate}% GST + markup)`
                  : "Customer Price (after markup)"}
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-slate-500"
                >
                  No items found for{" "}
                  <span className="font-medium">"{query}"</span>.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const name = item.itemName ?? item.name ?? "Untitled";
                const key = getKey(item) ?? name;
                const loading = Boolean(loadingMap[String(key)]);

                return (
                  <tr
                    key={String(key)}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Item name + tags (left) */}
                    <td className="px-4 py-4  max-w-[28ch]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-slate-700">
                            {String(name)
                              .split(" ")
                              .map((s) => s[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900">
                            {typeof name === "string"
                              ? highlight(name, query)
                              : name}
                          </div>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {item.tags
                                .slice(0, 3)
                                .map((t: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-600"
                                  >
                                    #{t}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Description (hidden on small screens) */}
                    {/* <td className="hidden md:table-cell px-4 py-4  text-sm text-slate-600">
                      {item.description ?? item.shortDescription ?? (
                        <span className="text-slate-400">—</span>
                      )}
                    </td> */}

                    {/* Price — base → base+GST → base+GST+markup */}
                    <td className="px-4 py-4 text-right">
                      {item.variants && item.variants.length > 0 && !(item.variants.length === 1 && item.variants[0].name?.toLowerCase().trim() === "default") ? (
                        (() => {
                          const prices = item.variants.map((v: any) => v.price as number);
                          const minBase = Math.min(...prices);
                          const maxBase = Math.max(...prices);
                          const minCalc = calcPrice(minBase);
                          const maxCalc = calcPrice(maxBase);
                          return (
                            <div className="flex flex-col items-end gap-0.5">
                              {/* Customer price = shop + GST + markup */}
                              <span className="text-sm font-bold text-slate-800">
                                ₹{minCalc.customerPrice} – ₹{maxCalc.customerPrice}
                              </span>
                              {/* Shop + GST (intermediate, only when GST enabled) */}
                              {gstEnabled && (
                                <span className="text-[10px] text-slate-400">
                                  ₹{minCalc.withGst} – ₹{maxCalc.withGst} shop + {gstRate}% GST
                                </span>
                              )}
                              {/* Base shop price */}
                              <span className="text-[10px] text-slate-300">
                                ₹{minBase} – ₹{maxBase} shop price · {item.variants.length} var.
                              </span>
                            </div>
                          );
                        })()
                      ) : (() => {
                        const base = item.price ?? item.pricePerPiece ?? item.pricePerKg ?? item.pricePerSft ?? 0;
                        const { withGst, customerPrice } = calcPrice(base);
                        return (
                          <div className="flex flex-col items-end gap-0.5">
                            {/* Final customer price (shop + GST + markup) */}
                            <span className="text-sm font-bold text-slate-800">
                              ₹{customerPrice}
                            </span>
                            {/* Shop + GST: shown when GST enabled and it differs from base */}
                            {gstEnabled && withGst !== base && (
                              <span className="text-[10px] text-slate-400">
                                ₹{withGst} shop + {gstRate}% GST
                              </span>
                            )}
                            {/* Base shop price */}
                            <span className="text-[10px] text-slate-300">
                              ₹{base} shop price
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Status (toggle) */}
                    <td className="px-4 py-4  text-center">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={loading}
                          aria-pressed={Boolean(item.isActive)}
                          className={`relative inline-flex items-center p-0.5 rounded-full focus:outline-none ${item.isActive ? "bg-emerald-600" : "bg-slate-200"
                            } transition`}
                          title={
                            item.isActive
                              ? "Active — click to deactivate"
                              : "Inactive — click to activate"
                          }
                          style={{ width: 56, height: 32 }}
                        >
                          {/* thumb */}
                          <span
                            className={`relative inline-block w-7 h-7 transform rounded-full bg-white shadow-sm transition-all ${item.isActive
                              ? "translate-x-[24px]"
                              : "translate-x-[4px]"
                              }`}
                          />
                          {loading && (
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                              <svg
                                className="animate-spin h-4 w-4 text-slate-600"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 100 24 12 12 0 01-8-20z"
                                />
                              </svg>
                            </span>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4  text-right space-x-2">
                      <button
                        onClick={() =>
                          setModal({
                            type: "edit-item",
                            data: {
                              component: (props: any) => (
                                <EditItemModal
                                  shopId={shopId}
                                  service={service}
                                  category={selectedCategory}
                                  item={item}
                                  items={items}
                                  closeModal={props.closeModal}
                                />
                              ),
                            },
                          })
                        }
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-100 bg-white hover:bg-slate-50 text-sm shadow-sm focus:outline-none"
                        aria-label={`Edit ${name}`}
                      >
                        {/* edit icon */}
                        <svg
                          className="h-4 w-4 text-slate-600"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M3 21l3-1 11-11 1-3-3 1L4 17l-1 3z"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        onClick={() =>
                          setModal({
                            type: "delete-item",
                            data: {
                              component: (props: any) => (
                                <DeleteItemModal
                                  shopId={shopId}
                                  service={service}
                                  category={selectedCategory}
                                  item={item}
                                  closeModal={props.closeModal}
                                />
                              ),
                            },
                          })
                        }
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 text-sm shadow-sm focus:outline-none"
                        aria-label={`Delete ${name}`}
                      >
                        {/* delete icon */}
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M3 6h18"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8 6l1-2h6l1 2"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 11v6M14 11v6"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <rect
                            x="4"
                            y="6"
                            width="16"
                            height="14"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          />
                        </svg>
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
