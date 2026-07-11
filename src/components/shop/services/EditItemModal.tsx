"use client";

import { useMemo, useState, useEffect } from "react";
import { editShopItem, deleteShopItem } from "@/lib/actions/shopServices";
import { getAllGlobalVariantOptions } from "@/lib/actions/globalVariantOptions";
import { GlobalVariantOption as GlobalVariantOptionType } from "@/types/global";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2 } from "lucide-react";

interface Props {
  shopId: string;
  service: any;
  category: {
    categoryId: string;
    globalCategoryId?: string;
    name: string;
  };
  item: any;
  items: any[];
  closeModal: () => void;
}

interface Option {
  name: string;
  values: { value: string; selected: boolean }[];
}

interface Variant {
  variantId?: string;
  name: string;
  price: string;
  unit?: "piece" | "kg" | "sft";
  isActive: boolean;
}

export default function EditItemModal({
  shopId,
  service,
  category,
  item,
  items,
  closeModal,
}: Props) {
  const router = useRouter();

  const itemId = item?.shopServiceCategoryItemId || item?.id;

  const [name, setName] = useState(item?.itemName || item?.name || "");
  const [description, setDescription] = useState(item?.description || item?.shortDescription || "");
  const [unit, setUnit] = useState<"piece" | "kg" | "sft">(() => {
    if (item?.unit) return item.unit;
    if (item?.pricePerPiece !== undefined) return "piece";
    if (item?.pricePerKg !== undefined) return "kg";
    if (item?.pricePerSft !== undefined) return "sft";
    return "piece";
  });
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || item?.ItemPicdata || item?.image || "");

  // Initialize options with values marked as selected if they're used in existing variants
  const [options, setOptions] = useState<Option[]>(() => {
    if (!item?.options || !item?.variants) {
      return item?.options?.map((o: any) => ({
        ...o,
        values: o.values?.map((v: string) => ({ value: v, selected: true })) || []
      })) || [];
    }

    // Get all values that are actually used in variants
    const usedValues = new Set<string>();
    item.variants.forEach((variant: any) => {
      const parts = variant.name.split(" / ");
      parts.forEach((part: string) => usedValues.add(part.trim()));
    });

    return item.options.map((o: any) => ({
      ...o,
      values: o.values?.map((v: string) => ({
        value: v,
        selected: usedValues.has(v) // Only select if used in a variant
      })) || []
    }));
  });

  const [variants, setVariants] = useState<Variant[]>(() => {
    if (item?.variants && item.variants.length > 0) {
      return item.variants.map((v: any) => ({
        ...v,
        price: String(v.price ?? ""),
        unit: v.unit,
        isActive: v.isActive ?? true
      }));
    }
    const basePrice = item?.price ?? item?.pricePerPiece ?? item?.pricePerKg ?? item?.pricePerSft ?? "";
    return [{ name: "Default", price: String(basePrice), isActive: true }];
  });

  const [hasVariants, setHasVariants] = useState(() => {
    if (options.length > 0 && options.some(o => o.values.some(v => v.selected))) return true;
    if (item?.variants && item.variants.length > 0) {
      if (item.variants.length === 1 && item.variants[0].name === "Default") return false;
      return true;
    }
    return false;
  });

  const [loading, setLoading] = useState(false);
  const [pendingValues, setPendingValues] = useState<{ [key: number]: string }>({});
  const [variantPresets, setVariantPresets] = useState<GlobalVariantOptionType[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const presets = await getAllGlobalVariantOptions();
        setVariantPresets(presets);
      } catch (e) {
        console.error("Failed to load variant presets", e);
      }
    })();
  }, []);

  const addOption = () => {
    setOptions([...options, { name: "", values: [] }]);
  };

  const applyPreset = (presetIndex: number) => {
    const preset = variantPresets[presetIndex];
    if (!preset) return;

    const existingIdx = options.findIndex(o => o.name === preset.name);
    let newOptions = [...options];

    if (existingIdx >= 0) {
      const existingValues = new Set(newOptions[existingIdx].values.map(v => v.value));
      preset.values.forEach(v => {
        if (!existingValues.has(v)) {
          newOptions[existingIdx].values.push({ value: v, selected: false });
        }
      });
    } else {
      const emptyIdx = newOptions.findIndex(o => o.name === "" && o.values.length === 0);
      if (emptyIdx >= 0) {
        newOptions[emptyIdx] = { name: preset.name, values: preset.values.map(v => ({ value: v, selected: false })) };
      } else {
        newOptions.push({ name: preset.name, values: preset.values.map(v => ({ value: v, selected: false })) });
      }
    }
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const updateOptionName = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index].name = val;
    setOptions(newOptions);
  };

  const handlePendingValueChange = (index: number, val: string) => {
    setPendingValues({ ...pendingValues, [index]: val });
  };

  const addPendingValue = (index: number) => {
    const val = pendingValues[index]?.trim();
    if (!val) return;
    if (options[index].values.some(v => v.value === val)) return;

    const newOptions = [...options];
    newOptions[index].values.push({ value: val, selected: true });
    setOptions(newOptions);
    setPendingValues({ ...pendingValues, [index]: "" });
  };

  const removeOptionValue = (optIndex: number, valIndex: number) => {
    const newOptions = [...options];
    newOptions[optIndex].values = newOptions[optIndex].values.filter((_, i) => i !== valIndex);
    setOptions(newOptions);
  };

  const toggleValueSelection = (optIndex: number, valueIndex: number) => {
    const newOptions = [...options];
    newOptions[optIndex].values[valueIndex].selected = !newOptions[optIndex].values[valueIndex].selected;
    setOptions(newOptions);
  };

  const generateVariants = () => {
    const validOptions = options
      .filter(o => o.values.length > 0)
      .map(o => ({
        ...o,
        values: o.values.filter(v => v.selected && v.value.trim()).map(v => v.value)
      }))
      .filter(o => o.values.length > 0);

    if (validOptions.length === 0) return;

    const cartesian = (args: string[][]): string[][] => {
      const r: string[][] = [];
      const max = args.length - 1;
      function helper(arr: string[], i: number) {
        for (let j = 0, l = args[i].length; j < l; j++) {
          const a = arr.slice(0);
          a.push(args[i][j]);
          if (i === max) r.push(a);
          else helper(a, i + 1);
        }
      }
      helper([], 0);
      return r;
    };

    const combinations = cartesian(validOptions.map(o => o.values));
    const newVariants = combinations.map(combo => {
      const vName = combo.join(" / ");
      const existing = variants.find(v => v.name === vName);
      return {
        variantId: existing?.variantId,
        name: vName,
        price: existing?.price || "",
        unit: existing?.unit,
        isActive: existing?.isActive ?? true,
      };
    });
    setVariants(newVariants);
  };

  const updateVariantPrice = (index: number, price: string) => {
    const newVariants = [...variants];
    newVariants[index].price = price;
    setVariants(newVariants);
  };

  const updateVariantUnit = (index: number, unit: "piece" | "kg" | "sft" | "") => {
    const newVariants = [...variants];
    newVariants[index].unit = unit === "" ? undefined : unit;
    setVariants(newVariants);
  };

  const toggleVariantStatus = (index: number) => {
    const newVariants = [...variants];
    newVariants[index].isActive = !newVariants[index].isActive;
    setVariants(newVariants);
  };

  const addCustomVariant = () => {
    setVariants([...variants, { name: "Custom Variant", price: "0", isActive: true }]);
  };

  const deleteVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return alert("Name is required");

    const payload: any = {
      name: name.trim(),
      description: description.trim() || undefined,
      unit,
      imageUrl: imageUrl.trim() || undefined,
    };

    if (hasVariants) {
      payload.options = options
        .filter(o => o.name.trim() !== "" && o.values.length > 0)
        .map(o => ({
          name: o.name,
          values: o.values.map(v => v.value).filter(v => !!v.trim())
        }));

      payload.variants = variants
        .map(v => ({
          variantId: v.variantId,
          name: v.name,
          price: Number(v.price) || 0,
          unit: v.unit,
          isActive: v.isActive
        }))
        .filter(v => v.price > 0);

      if (payload.variants.length === 0) {
        return alert("At least one variant with a valid price is required");
      }
    } else {
      // For single items, do NOT send options or variants array at all
      // This tells the backend to treat it as a non-variation item
      const price = Number(variants[0]?.price) || 0;
      if (isNaN(price) || price < 0) {
        return alert("A valid base price is required");
      }

      payload.price = price;
      if (unit === "piece") payload.pricePerPiece = price;
      else if (unit === "kg") payload.pricePerKg = price;
      else if (unit === "sft") payload.pricePerSft = price;
    }

    try {
      setLoading(true);
      await editShopItem(
        shopId,
        service.serviceID,
        category.categoryId,
        itemId,
        payload as any
      );
      router.refresh();
      closeModal();
    } catch (e: any) {
      alert(e?.message || "Error updating item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <form
        onSubmit={handleUpdate}
        className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b bg-white shrink-0">
          <div className="flex items-center gap-2">
            <button type="button" onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <h2 className="text-lg font-bold text-slate-800">Edit product</h2>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={async () => {
                if (confirm("Are you sure you want to delete this item completely?")) {
                  try {
                    setLoading(true);
                    await deleteShopItem(shopId, service.serviceID, category.categoryId, itemId);
                    router.refresh();
                    closeModal();
                  } catch(e: any) {
                    alert(e?.message || "Failed to delete item");
                    setLoading(false);
                  }
                }
              }}
              className="px-4 py-2 bg-rose-50 text-rose-600 text-sm font-semibold rounded-lg hover:bg-rose-100 transition-all flex items-center gap-2 mr-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Item
            </button>
            <div className="px-3 py-1 bg-slate-100 text-xs font-medium text-slate-500 rounded-md border flex items-center">
              {loading ? "Updating..." : "Unsaved changes"}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all"
            >
              Update {loading && "..."}
            </button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">

            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">

              {/* Product Info */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. Cotton Shirt"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 outline-none min-h-[120px]"
                    placeholder="Product details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Media */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <label className="block text-sm font-medium text-slate-700">Image URL</label>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <div className="mt-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview</label>
                    <div className="mt-2 w-32 h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-inner flex items-center justify-center">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover transition-transform hover:scale-110" />
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center">
                          <Plus className="w-6 h-6 mb-1 opacity-50" />
                          <span className="text-[10px] uppercase font-bold">No Image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Options & Variants */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                {!hasVariants ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pricing</h3>
                      <button
                        type="button"
                        onClick={() => setHasVariants(true)}
                        className="text-xs text-blue-600 font-bold hover:text-blue-700 transition-colors flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" /> ADD VARIATIONS
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Base Price</label>
                        <div className="relative group">
                          <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-bold group-focus-within:text-blue-500 transition-colors">₹</span>
                          <input
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 pl-8 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all font-medium"
                            placeholder="0.00"
                            value={variants[0]?.price || ""}
                            onChange={(e) => updateVariantPrice(0, e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Base Unit</label>
                        <select
                          className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all font-medium appearance-none"
                          value={variants[0]?.unit || ""}
                          onChange={(e) => updateVariantUnit(0, e.target.value as any)}
                        >
                          <option value="">Inherit ({unit})</option>
                          <option value="piece">Per Piece</option>
                          <option value="kg">Per Kg</option>
                          <option value="sft">Per Sft</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        This item currently has no variations. Enabling variations allows you to manage different sizes, colors, or other options with individual pricing.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Product Options</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Manage sizes, colors, and other variations.</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Are you sure? This will remove all options and variants, keeping only the base info.")) {
                              setHasVariants(false);
                              setOptions([]);
                              setVariants([{ name: "Default", price: variants[0]?.price || "", isActive: true }]);
                            }
                          }}
                          className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 border border-slate-200 rounded-lg uppercase tracking-wider"
                        >
                          Convert to Single Item
                        </button>
                        <select
                          className="text-[10px] font-bold uppercase tracking-wider border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                          onChange={(e) => {
                            if (e.target.value !== "") {
                              applyPreset(Number(e.target.value));
                              e.target.value = "";
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="">⚡ PRESETS</option>
                          {variantPresets.map((p, idx) => (
                            <option key={idx} value={idx}>{p.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={addOption}
                          className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3 h-3" /> CUSTOM
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {options.map((opt, optIdx) => (
                        <div key={optIdx} className="pb-6 border-b last:border-0 border-slate-100">
                          <div className="flex justify-between mb-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Option Name</label>
                            <button type="button" onClick={() => removeOption(optIdx)} className="text-[10px] font-bold text-red-500 uppercase tracking-wider hover:bg-red-50 px-2 py-1 rounded transition-colors">Remove Option</button>
                          </div>
                          <input
                            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm mb-4 focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all font-medium"
                            value={opt.name}
                            onChange={(e) => updateOptionName(optIdx, e.target.value)}
                            placeholder="e.g. Size, Color..."
                          />

                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Values</label>
                          <div className="bg-white border border-slate-300 rounded-xl p-2.5 min-h-[48px] flex flex-wrap gap-2.5 items-center focus-within:ring-4 focus-within:ring-blue-50/50 focus-within:border-blue-500 transition-all">
                            {opt.values.map((v, vIdx) => (
                              <div key={vIdx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${v.selected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                <input
                                  type="checkbox"
                                  checked={v.selected}
                                  onChange={() => toggleValueSelection(optIdx, vIdx)}
                                  className="rounded border-white/30 text-white focus:ring-0 focus:ring-offset-0 bg-transparent w-4 h-4 cursor-pointer"
                                />
                                <span>{v.value}</span>
                                <button type="button" onClick={() => removeOptionValue(optIdx, vIdx)} className={`ml-1 transition-opacity ${v.selected ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-red-500'}`}>
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <input
                              className="flex-1 min-w-[140px] outline-none text-sm bg-transparent h-full py-1.5 px-2 font-medium"
                              placeholder="Type and press Enter..."
                              value={pendingValues[optIdx] || ""}
                              onChange={(e) => handlePendingValueChange(optIdx, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
                                  e.preventDefault();
                                  addPendingValue(optIdx);
                                }
                              }}
                              onBlur={() => addPendingValue(optIdx)}
                            />
                          </div>
                        </div>
                      ))}

                      {options.length > 0 && (
                        <button
                          type="button"
                          onClick={generateVariants}
                          className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                        >
                          <Plus className="w-4 h-4" /> REGENERATE VARIANTS
                        </button>
                      )}

                      {variants.length > 0 && (
                        <div className="mt-8">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Variant Matrix ({variants.length})</h3>
                            <button
                              type="button"
                              onClick={addCustomVariant}
                              className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                            >
                              <Plus className="w-3 h-3" /> ADD CUSTOM VARIANT
                            </button>
                          </div>
                          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                            <table className="w-full text-sm text-left font-sans">
                              <thead className="bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                  <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Variant Combination</th>
                                  <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-36">Price</th>
                                  <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-36">Unit Override</th>
                                  <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-28 text-center">Status</th>
                                  <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-12 text-center">Del</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {variants.map((v, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-4">
                                      <input
                                        className="w-full bg-transparent border-0 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                                        value={v.name}
                                        onChange={(e) => {
                                          const newVariants = [...variants];
                                          newVariants[idx].name = e.target.value;
                                          setVariants(newVariants);
                                        }}
                                      />
                                    </td>
                                    <td className="px-5 py-4">
                                      <div className="relative group/price">
                                        <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold transition-colors group-focus-within/price:text-blue-500">₹</span>
                                        <input
                                          className="w-full border border-slate-200 rounded-lg px-3 py-2 pl-6 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all font-medium"
                                          placeholder="0"
                                          value={v.price}
                                          onChange={(e) => updateVariantPrice(idx, e.target.value)}
                                        />
                                      </div>
                                    </td>
                                    <td className="px-5 py-4">
                                      <select
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 bg-white transition-all font-medium appearance-none"
                                        value={v.unit || ""}
                                        onChange={(e) => updateVariantUnit(idx, e.target.value as any)}
                                      >
                                        <option value="">Default ({unit})</option>
                                        <option value="piece">Per Piece</option>
                                        <option value="kg">Per Kg</option>
                                        <option value="sft">Per Sft</option>
                                      </select>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                      <button
                                        type="button"
                                        onClick={() => toggleVariantStatus(idx)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${v.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
                                      >
                                        {v.isActive ? 'Active' : 'Draft'}
                                      </button>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                      <button
                                        type="button"
                                        onClick={() => deleteVariant(idx)}
                                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-semibold text-slate-800 text-sm">Organization</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">Category</label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600">
                    {category.name}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">Base Pricing Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-blue-500"
                  >
                    <option value="piece">Per Piece</option>
                    <option value="kg">Per Kilogram</option>
                    <option value="sft">Per Sq. Ft</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
