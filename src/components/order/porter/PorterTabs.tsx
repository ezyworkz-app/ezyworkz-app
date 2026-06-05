"use client";

import React, { useState } from "react";
import PorterTracking from "./PorterTracking";

type PorterTab = {
  key: string;
  label: string;
  data: any;
  type: string; // 👈 add this
};

export default function PorterTabs({
  tabs,
  orderId,
}: {
  tabs: PorterTab[];
  orderId: string;
}) {
  const [active, setActive] = useState(tabs[0]?.key);

  const activeTab = tabs.find((t) => t.key === active);

  if (!tabs.length) {
    return (
      <p className="p-4 text-center text-gray-500">
        No tracking data available
      </p>
    );
  }

  return (
    <div>
      {/* Tab Buttons */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
              active === tab.key
                ? "border-blue-500 text-blue-600 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab && (
          <PorterTracking
            order={activeTab.data}
            orderId={orderId}
            type={activeTab.type}
          />
        )}
      </div>
    </div>
  );
}
