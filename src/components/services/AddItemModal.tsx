"use client";

import { useState } from "react";
import apiClient from "@/lib/api/client";
import { Plus, X } from "lucide-react";

interface Props {
  shopId: string;
  service: any;
  category: any;
  closeModal: () => void;
  onRefresh: () => void;
}

interface Option {
  name: string;
  values: { value: string; selected: boolean }[];
}

interface Variant {
  name: string;
  price: string;
  unit?: "piece" | "kg" | "sft";
  isActive: boolean;
}

export default function AddItemModal({
  shopId,
  service,
  category,
  closeModal,
  onRefresh
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState<"piece" | "kg" | "sft">("piece");
  const [imageUrl, setImageUrl] = useState("");

  const [options, setOptions] = useState<Option[]>([]);
  const [variants, setVariants] = useState<Variant[]>([{ name: "Default", price: "", unit: undefined, isActive: true }]);
  const [hasVariants, setHasVariants] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState<{ [key: number]: string }>({});

  const addOption = () => {
    setOptions([...options, { name: "", values: [] }]);
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

  const updateVariantUnit = (index: number, newUnit: "piece" | "kg" | "sft" | "") => {
    const newVariants = [...variants];
    newVariants[index].unit = newUnit === "" ? undefined : newUnit;
    setVariants(newVariants);
  };

  const toggleVariantStatus = (index: number) => {
    const newVariants = [...variants];
    newVariants[index].isActive = !newVariants[index].isActive;
    setVariants(newVariants);
  };

  async function handleSubmit(e: React.FormEvent) {
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
      const price = Number(variants[0]?.price) || 0;
      if (isNaN(price) || price <= 0) {
        return alert("A valid base price is required");
      }

      if (unit === "piece") payload.pricePerPiece = price;
      else if (unit === "kg") payload.pricePerKg = price;
      else if (unit === "sft") payload.pricePerSft = price;
      
      payload.price = price;
      payload.isActive = true;
    }

    setSubmitting(true);
    try {
      const serviceId = service.shopServiceId || service.serviceID || service.id;
      const catId = category.shopServiceCategoryId || category.categoryId || category.id;
      
      await apiClient.post(`/shops/${shopId}/services/${serviceId}/categories/${catId}/items`, payload);
      onRefresh();
      closeModal();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to create item");
    } finally {
      setSubmitting(false);
    }
  }

  function combinationsExist(opts: Option[]) {
    return opts.some(o => o.values.some(v => v.selected));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="bg-[#151c2f] w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden text-white"
      >
        <div className="flex justify-between items-center p-5 border-b border-card-border bg-[#0e1424] shrink-0">
          <div className="flex items-center gap-3">
            <button type="button" onClick={closeModal} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <h2 className="text-lg font-bold text-white tracking-tight">Add product</h2>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-teal-500 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? "SAVING..." : "SAVE PRODUCT"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-[#0e1424] p-5 rounded-xl border border-card-border space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
                  <input
                    className="w-full border border-slate-700 bg-slate-800/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all text-white placeholder:text-slate-500"
                    placeholder="e.g. Cotton Shirt"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                  <textarea
                    className="w-full border border-slate-700 bg-slate-800/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none min-h-[120px] text-white placeholder:text-slate-500"
                    placeholder="Product details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-[#0e1424] p-5 rounded-xl border border-card-border space-y-4">
                <label className="block text-sm font-medium text-slate-300">Image URL</label>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    className="w-full border border-slate-700 bg-slate-800/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-[#0e1424] p-6 rounded-xl border border-card-border">
                {!hasVariants ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pricing</h3>
                      <button
                        type="button"
                        onClick={() => setHasVariants(true)}
                        className="text-xs text-teal-400 font-bold hover:text-teal-300 transition-colors flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 rounded-lg border border-teal-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" /> ADD VARIATIONS
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Base Price</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2 text-slate-400 text-sm font-bold">₹</span>
                          <input
                            className="w-full border border-slate-700 bg-slate-800/50 rounded-xl px-4 py-2 pl-8 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/50 transition-all font-medium text-white placeholder:text-slate-500"
                            placeholder="0.00"
                            value={variants[0]?.price || ""}
                            onChange={(e) => updateVariantPrice(0, e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Base Unit</label>
                        <select
                          className="w-full border border-slate-700 bg-slate-800/50 rounded-xl px-4 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/50 transition-all font-medium text-white appearance-none"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value as any)}
                        >
                          <option value="piece">Per Piece</option>
                          <option value="kg">Per Kg</option>
                          <option value="sft">Per Sft</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Product Options</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Are you sure? This will remove all options and variants.")) {
                              setHasVariants(false);
                              setOptions([]);
                              setVariants([{ name: "Default", price: variants[0]?.price || "", isActive: true }]);
                            }
                          }}
                          className="text-[10px] font-bold text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 border border-slate-700 rounded-lg uppercase tracking-wider bg-slate-800/50"
                        >
                          Convert to Single Item
                        </button>
                        <button
                          type="button"
                          onClick={addOption}
                          className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-3 py-1.5 rounded-lg hover:bg-teal-500/20 border border-teal-500/20 transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3 h-3" /> ADD OPTION
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {options.map((opt, optIdx) => (
                        <div key={optIdx} className="pb-6 border-b last:border-0 border-slate-800">
                          <div className="flex justify-between mb-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Option Name</label>
                            <button type="button" onClick={() => removeOption(optIdx)} className="text-[10px] font-bold text-red-400 uppercase tracking-wider hover:bg-red-400/10 px-2 py-1 rounded transition-colors">Remove Option</button>
                          </div>
                          <input
                            className="w-full border border-slate-700 bg-slate-800/50 rounded-xl px-4 py-2 text-sm mb-4 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all font-medium text-white placeholder:text-slate-500"
                            value={opt.name}
                            onChange={(e) => updateOptionName(optIdx, e.target.value)}
                            placeholder="e.g. Size, Color..."
                          />

                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Values</label>
                          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5 min-h-[48px] flex flex-wrap gap-2.5 items-center focus-within:ring-2 focus-within:ring-teal-500/50 focus-within:border-teal-500 transition-all">
                            {opt.values.map((v, vIdx) => (
                              <div key={vIdx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${v.selected ? 'bg-teal-500 text-white border-teal-500' : 'bg-[#0e1424] text-slate-300 border-slate-700'}`}>
                                <input
                                  type="checkbox"
                                  checked={v.selected}
                                  onChange={() => toggleValueSelection(optIdx, vIdx)}
                                  className="rounded border-slate-600 bg-transparent text-teal-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                                />
                                <span>{v.value}</span>
                                <button type="button" onClick={() => removeOptionValue(optIdx, vIdx)} className={`ml-1 transition-colors ${v.selected ? 'text-white/70 hover:text-white' : 'text-slate-500 hover:text-red-400'}`}>
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <input
                              className="flex-1 min-w-[140px] outline-none text-sm bg-transparent h-full py-1.5 px-2 font-medium text-white placeholder:text-slate-500"
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

                      <button
                        type="button"
                        onClick={generateVariants}
                        className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2 mt-4 border border-slate-700"
                      >
                        <Plus className="w-4 h-4" /> GENERATE VARIANTS
                      </button>

                      {variants.length > 0 && combinationsExist(options) && (
                        <div className="mt-8">
                          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Variant Matrix ({variants.length})</h3>
                          <div className="border border-slate-700 rounded-2xl overflow-hidden bg-[#0e1424]">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-slate-800/50 border-b border-slate-700">
                                <tr>
                                  <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[10px]">Combination</th>
                                  <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[10px] w-32">Price</th>
                                  <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[10px] w-32">Unit Override</th>
                                  <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[10px] w-24 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {variants.map((v, idx) => (
                                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-3 font-bold text-white">{v.name}</td>
                                    <td className="px-4 py-3">
                                      <div className="relative group">
                                        <span className="absolute left-3 top-2 text-slate-500 text-xs font-bold transition-colors group-focus-within:text-teal-400">₹</span>
                                        <input
                                          className="w-full border border-slate-700 bg-slate-800/50 rounded-lg px-2 py-1.5 pl-6 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-medium text-white placeholder:text-slate-500"
                                          placeholder="0"
                                          value={v.price}
                                          onChange={(e) => updateVariantPrice(idx, e.target.value)}
                                        />
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <select
                                        className="w-full border border-slate-700 bg-slate-800/50 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-medium appearance-none text-white"
                                        value={v.unit || ""}
                                        onChange={(e) => updateVariantUnit(idx, e.target.value as any)}
                                      >
                                        <option value="">Default</option>
                                        <option value="piece">Per Piece</option>
                                        <option value="kg">Per Kg</option>
                                        <option value="sft">Per Sft</option>
                                      </select>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => toggleVariantStatus(idx)}
                                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all ${v.isActive ? 'bg-teal-500/20 text-teal-400 border-teal-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                                      >
                                        {v.isActive ? 'Active' : 'Draft'}
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

            <div className="space-y-6">
              <div className="bg-[#0e1424] p-5 rounded-xl border border-card-border space-y-4">
                <h3 className="font-semibold text-white text-sm">Organization</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Category</label>
                  <div className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
                    {category.name}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Base Pricing Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full border border-slate-700 bg-slate-800/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white"
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
