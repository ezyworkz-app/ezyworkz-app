"use client";

import React, { useState } from "react";
import { ShopTiming } from "@/types/Shop";
import { updateShopTiming } from "@/lib/actions/shops";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Plus, Trash2, Save, Clock } from "lucide-react";

interface ShopTimingEditorProps {
  shopId: string;
  initialTiming: ShopTiming;
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function ShopTimingEditor({
  shopId,
  initialTiming,
}: ShopTimingEditorProps) {
  const [timing, setTiming] = useState<ShopTiming>(initialTiming);
  const [isSaving, setIsSaving] = useState(false);

  const toggleDay = (day: string) => {
    setTiming((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        working: !prev[day]?.working,
        slots: prev[day]?.slots || [{ open: "09:00", close: "21:00" }],
      },
    }));
  };

  const addSlot = (day: string) => {
    setTiming((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...(prev[day]?.slots || []), { open: "09:00", close: "21:00" }],
      },
    }));
  };

  const removeSlot = (day: string, index: number) => {
    setTiming((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index),
      },
    }));
  };

  const updateSlot = (
    day: string,
    index: number,
    field: "open" | "close",
    value: string
  ) => {
    setTiming((prev) => {
      const newSlots = [...prev[day].slots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return {
        ...prev,
        [day]: {
          ...prev[day],
          slots: newSlots,
        },
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateShopTiming(shopId, timing);
      if (result.success) {
        alert("Shop timings updated successfully");
      } else {
        alert(result.error || "Failed to update timings");
      }
    } catch (error) {
      alert("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock size={20} className="text-blue-600" />
            Manage Shop Timings
          </h3>
          <p className="text-sm text-gray-500">
            Set the operational hours for each day of the week.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? "Saving..." : <><Save size={18} /> Save Changes</>}
        </Button>
      </div>

      <div className="grid gap-4">
        {DAYS.map((day) => {
          const dayData = timing[day] || { working: false, slots: [] };
          return (
            <div
              key={day}
              className={`border rounded-lg p-4 transition-colors ${
                dayData.working ? "bg-white" : "bg-gray-50 opacity-75"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={`toggle-${day}`}
                    checked={dayData.working}
                    onChange={() => toggleDay(day)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor={`toggle-${day}`}
                    className={`text-lg font-medium capitalize cursor-pointer ${
                      dayData.working ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {day}
                  </label>
                </div>
                {dayData.working && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addSlot(day)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Plus size={16} className="mr-1" /> Add Slot
                  </Button>
                )}
              </div>

              {dayData.working ? (
                <div className="space-y-3">
                  {dayData.slots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <Input
                          type="time"
                          label="Open"
                          value={slot.open}
                          onChange={(e) =>
                            updateSlot(day, index, "open", e.target.value)
                          }
                        />
                        <Input
                          type="time"
                          label="Close"
                          value={slot.close}
                          onChange={(e) =>
                            updateSlot(day, index, "close", e.target.value)
                          }
                        />
                      </div>
                      {dayData.slots.length > 1 && (
                        <button
                          onClick={() => removeSlot(day, index)}
                          className="mt-6 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                          title="Remove slot"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  {dayData.slots.length === 0 && (
                    <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                      Please add at least one time slot or mark the day as closed.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Shop is closed on {day}.</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
          {isSaving ? "Saving..." : <><Save size={18} /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
}
