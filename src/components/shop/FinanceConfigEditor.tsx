"use client";

import React, { useState, useTransition, useEffect } from "react";
import { updateShopDetails } from "@/lib/actions/shops";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Shop, FinanceConfig, CommissionHistoryEntry } from "@/types/Shop";
import { Loader2, Edit2, X, CheckCircle2, Percent, TrendingUp, Clock, Plus, Trash2, History } from "lucide-react";

interface FinanceConfigEditorProps {
  shop: Shop;
}

export default function FinanceConfigEditor({ shop }: FinanceConfigEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState<FinanceConfig>(
    shop.financeConfig || {
      commissionPercentage: 20.0,
      expressExtraPayoutPercentage: 50,
      oneDayExtraPayoutPercentage: 0,
      commissionHistory: [],
      updatedAt: new Date().toISOString(),
    }
  );
  const [history, setHistory] = useState<CommissionHistoryEntry[]>(
    shop.financeConfig?.commissionHistory || []
  );
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const updatedConfig = { ...config, commissionHistory: history, updatedAt: new Date().toISOString() };
      const res = await updateShopDetails(shop.shopId, {
        financeConfig: updatedConfig,
        financeHistory: shop.financeConfig
          ? [...(shop.financeHistory || []), shop.financeConfig]
          : shop.financeHistory,
      });
      if (res.success) setIsEditing(false);
      else alert(res.error || "Failed to update finance config");
    });
  };

  const handleCancel = () => {
    if (shop.financeConfig) {
      setConfig(shop.financeConfig);
      setHistory(shop.financeConfig.commissionHistory || []);
    }
    setIsEditing(false);
  };

  const addHistoryEntry = () => {
    setHistory((prev) => [...prev, { rate: 15, from: "", until: "", note: "" }]);
  };

  const updateHistoryEntry = (index: number, field: keyof CommissionHistoryEntry, value: string | number) => {
    setHistory((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const removeHistoryEntry = (index: number) => {
    setHistory((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Finance Configuration</h3>
          <p className="text-xs font-medium text-gray-400 mt-0.5">Platform commission and settlement bonuses</p>
        </div>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}
            className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-4">
            <Edit2 size={13} className="mr-2" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isPending}
              className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
              <X size={13} className="mr-1.5" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}
              className="bg-brand-500 hover:bg-brand-600 text-white">
              {isPending ? <Loader2 className="animate-spin mr-1.5" size={13} /> : <CheckCircle2 size={13} className="mr-1.5" />}
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isEditing ? (
          <>
            <Input id="commission-pct" label="Platform Commission (%)" name="commissionPercentage" type="number" step="0.1" value={config.commissionPercentage} onChange={handleChange} leftIcon={<Percent size={14} />} />
            <Input id="express-bonus-pct" label="Express Extra Payout (%)" name="expressExtraPayoutPercentage" type="number" step="1" value={config.expressExtraPayoutPercentage} onChange={handleChange} leftIcon={<TrendingUp size={14} />} />
            <Input id="oneday-bonus-pct" label="One Day Extra Payout (%)" name="oneDayExtraPayoutPercentage" type="number" step="1" value={config.oneDayExtraPayoutPercentage} onChange={handleChange} leftIcon={<Clock size={14} />} />
          </>
        ) : (
          <>
            <FinanceCard label="Platform Commission" value={`${config.commissionPercentage}%`} icon={<Percent size={14} className="text-brand-500" />} color="brand" />
            <FinanceCard label="Express Bonus" value={`${config.expressExtraPayoutPercentage}%`} icon={<TrendingUp size={14} className="text-success-500" />} color="success" />
            <FinanceCard label="One Day Bonus" value={`${config.oneDayExtraPayoutPercentage}%`} icon={<Clock size={14} className="text-indigo-500" />} color="indigo" />
          </>
        )}
      </div>

      {/* Commission History */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <History size={14} className="text-gray-400" />
            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Commission Rate History</span>
          </div>
          {isEditing && (
            <button onClick={addHistoryEntry}
              className="flex items-center gap-1.5 text-[11px] font-bold text-brand-500 hover:text-brand-600 transition-colors">
              <Plus size={13} /> Add Period
            </button>
          )}
        </div>

        {(isEditing ? history : (config.commissionHistory || [])).length === 0 ? (
          <p className="px-5 py-4 text-xs text-gray-400 font-medium">
            {isEditing ? "No historical periods added. Add one to track rate changes over time." : "No commission rate history recorded."}
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(isEditing ? history : (config.commissionHistory || [])).map((entry, i) => (
              <div key={i} className="px-5 py-3.5">
                {isEditing ? (
                  <div className="flex items-start gap-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Rate (%)</label>
                        <input
                          type="number" step="0.1" value={entry.rate}
                          onChange={(e) => updateHistoryEntry(i, "rate", parseFloat(e.target.value) || 0)}
                          className="w-full text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-400 dark:focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">From</label>
                        <input
                          type="date" value={entry.from}
                          onChange={(e) => updateHistoryEntry(i, "from", e.target.value)}
                          className="w-full text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-400 dark:focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Until <span className="normal-case font-medium text-gray-300">(leave blank if ongoing)</span></label>
                        <input
                          type="date" value={entry.until || ""}
                          onChange={(e) => updateHistoryEntry(i, "until", e.target.value)}
                          className="w-full text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-400 dark:focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Note</label>
                        <input
                          type="text" value={entry.note || ""} placeholder="e.g. Early partner rate"
                          onChange={(e) => updateHistoryEntry(i, "note", e.target.value)}
                          className="w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-400 dark:focus:border-brand-500 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                    <button onClick={() => removeHistoryEntry(i)}
                      className="mt-7 p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-base font-black text-gray-900 dark:text-white">{entry.rate}%</span>
                      <span className="text-xs font-medium text-gray-400">
                        {entry.from}
                        {entry.until ? ` → ${entry.until}` : " → present"}
                      </span>
                      {entry.note && (
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{entry.note}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${entry.until ? "bg-gray-100 dark:bg-gray-800 text-gray-400" : "bg-brand-50 dark:bg-brand-500/10 text-brand-500"}`}>
                      {entry.until ? "Past" : "Active"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isEditing && config.updatedAt && mounted && (
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">
          Last updated: {new Date(config.updatedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
        </p>
      )}
    </div>
  );
}

function FinanceCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: "brand" | "success" | "indigo" }) {
  const bg = { brand: "bg-brand-50 dark:bg-brand-500/10", success: "bg-success-50 dark:bg-success-500/10", indigo: "bg-indigo-50 dark:bg-indigo-500/10" }[color];
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-brand-200 dark:hover:border-brand-700 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-xl ${bg}`}>{icon}</div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
    </div>
  );
}
