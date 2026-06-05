import React from "react";
import { ShopTiming } from "@/types/Shop";

interface Props {
  shopTiming?: ShopTiming;
}
function to12h(t: string) {
  if (!t) return "";

  const s = t.trim();

  // Try to parse 12h with optional space before AM/PM: "h:mm AM", "hh:mmPM", etc.
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const m = parseInt(m12[2], 10);
    const period = m12[3].toUpperCase(); // "AM" | "PM"
    // Normalize hour to 1..12 for display
    h = ((h - 1) % 12) + 1; // 0/12 -> 12, 13 -> 1, etc.
    return `${h}:${m.toString().padStart(2, "0")} ${period}`;
  }

  // Try to parse 24h: "HH:mm" or "H:mm"
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    let h = parseInt(m24[1], 10);
    const m = parseInt(m24[2], 10);
    const period = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, "0")} ${period}`;
  }

  // Fallback: return as-is if it doesn't match expected formats
  return t;
}

export default function ShopTimingsSection({ shopTiming }: Props) {
  if (!shopTiming || Object.keys(shopTiming).length === 0) {
    return <p className="text-gray-500">No shop timings available.</p>;
  }

  return (
    <div className="space-y-2">
      {Object.entries(shopTiming).map(([day, detail]) => {
        const working = Boolean((detail as any)?.working);
        const slots: Array<{ open: string; close: string }> = Array.isArray(
          (detail as any)?.slots
        )
          ? (detail as any).slots
          : [];

        return (
          <div
            key={day}
            className="flex items-start justify-between border-b py-2"
          >
            <span className="capitalize font-medium">{day}</span>

            {!working ? (
              <span className="text-red-500">Closed</span>
            ) : slots.length === 0 ? (
              <span className="text-gray-500">No slots</span>
            ) : (
              <div className="text-right space-y-1">
                {slots.map((s, idx) => (
                  <div key={`${day}-${idx}`} className="text-sm">
                    {to12h(s.open)} – {to12h(s.close)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
