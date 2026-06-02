"use client";

import { useState } from "react";
import ServiceSidebar from "./ServiceSidebar";
import CategoryPanel from "./CategoryPanel";
import { ServiceModalRenderer } from "./ServiceModals";

interface Props {
  services: any[];
  globalServices: any[];
  shopId: string;
  onRefresh: () => void;
}

export default function ShopServices({ services, globalServices, shopId, onRefresh }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => {
    const firstCat = services.flatMap((svc) => svc.categories || [])[0];
    return firstCat ? (firstCat.shopServiceCategoryId || firstCat.categoryId || firstCat.id) : null;
  });

  const [openServiceId, setOpenServiceId] = useState<string | null>(() => {
    const firstWithCat = services.find((s) => (s.categories || []).length > 0);
    return firstWithCat ? (firstWithCat.shopServiceId || firstWithCat.serviceID || firstWithCat.id) : null;
  });

  const [modal, setModal] = useState<{ type: string; data?: any } | null>(null);

  const selectedCategory = services
    .flatMap((svc) => svc.categories || [])
    .find((cat) => (cat.shopServiceCategoryId || cat.categoryId || cat.id) === selectedCategoryId);

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <ServiceSidebar
        services={services}
        openServiceId={openServiceId}
        setOpenServiceId={setOpenServiceId}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        setModal={setModal}
      />

      {selectedCategory ? (
        <CategoryPanel
          service={services.find((s) =>
            (s.categories || []).some((c: any) => (c.shopServiceCategoryId || c.categoryId || c.id) === selectedCategoryId)
          )}
          selectedCategory={selectedCategory}
          setModal={setModal}
          shopId={shopId}
          onRefresh={onRefresh}
        />
      ) : (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-slate-500">
          <p className="mb-4 text-sm font-medium">Select a category to view items.</p>
        </div>
      )}

      <ServiceModalRenderer
        modal={modal}
        setModal={setModal}
        shopId={shopId}
        globalServices={globalServices}
        shopServices={services}
        onRefresh={onRefresh}
      />
    </div>
  );
}
