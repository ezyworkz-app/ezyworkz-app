"use client";

import React from "react";
import { Tab, Tabs } from "../ui/Tabs";
import Card from "../ui/Card";
import ShopServices from "./services/ShopServices";
import ShopInfoSection from "./ShopInfoSection";
import ShopAddressSection from "./ShopAddressSection";
import ShopAddressEditor from "./ShopAddressEditor";
import ShopTimingsSection from "./ShopTimingsSection";
import ShopTimingEditor from "./ShopTimingEditor";
import { Shop } from "@/types/Shop";
import ShopSettlements from "./settlements/ShopSettlements";
import FinanceConfigEditor from "./FinanceConfigEditor";
import BankDetailsEditor from "./BankDetailsEditor";
import GstEditor from "./GstEditor";
import PanGstKycEditor from "./PanGstKycEditor";

interface ShopDetailsClientProps {
  shop: Shop;
  // services: any[];
}

export default function ShopDetailsClient({
  shop,
}: // services,
  ShopDetailsClientProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{shop.name}</h1>

      <Tabs>
        <Tab title="Settlements">
          <ShopSettlements shopId={shop.shopId} />
        </Tab>

        <Tab title="Finance Config">
          <Card>
            <FinanceConfigEditor shop={shop} />
          </Card>
        </Tab>

        <Tab title="Shop Info">
          <Card>
            <ShopInfoSection shop={shop} />
          </Card>
        </Tab>

        <Tab title="Address">
          <Card>
            <ShopAddressEditor shop={shop} />
          </Card>
        </Tab>

        <Tab title="Bank Details">
          <Card>
            <BankDetailsEditor shopId={shop.shopId} />
          </Card>
        </Tab>

        <Tab title="PAN / GST">
          <div className="space-y-6">
            <Card>
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-5">
                KYC Documents
              </h2>
              <PanGstKycEditor shopId={shop.shopId} />
            </Card>
            <Card>
              <GstEditor shop={shop} />
            </Card>
          </div>
        </Tab>

        <Tab title="Shop Timings">
          <Card>
            <ShopTimingEditor shopId={shop.shopId} initialTiming={shop.shopTiming || {}} />
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
