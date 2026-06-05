"use client";

import { TreeViewService } from "@/lib/actions/shopServices";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CategoryPanel from "./CategoryPanel";
import { ModalRenderer } from "./ServiceModal";
import ServiceSidebar from "./ServiceSidebar";

interface Props {
  services: TreeViewService[];
  shopId: string;
  gstEnabled?: boolean;
  gstRate?: number;
  markupTiers?: { percent: number; upto?: number }[];
}

export default function ShopServices({ services, shopId, gstEnabled = false, gstRate = 18, markupTiers = [] }: Props) {
  const router = useRouter();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    () => {
      const firstCat = services.flatMap((svc) => svc.categories)[0];
      return firstCat?.categoryId || null;
    }
  );

  const [openServiceId, setOpenServiceId] = useState<string | null>(() => {
    const firstWithCat = services.find((s) => s.categories.length > 0);
    return firstWithCat?.serviceID || null;
  });

  const [modal, setModal] = useState<{
    type: string;
    data?: any;
  } | null>(null);

  const selectedCategory = services
    .flatMap((svc) => svc.categories)
    .find((cat) => cat.categoryId === selectedCategoryId);

  return (
    <div className="flex min-h-[80vh] max-w-7xl mx-auto mt-8 border bg-white rounded-xl shadow-sm overflow-hidden">
      <ServiceSidebar
        services={services}
        shopId={shopId}
        openServiceId={openServiceId}
        setOpenServiceId={setOpenServiceId}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        setModal={setModal}
        refresh={() => router.refresh()}
      />

      {selectedCategory ? (
        <CategoryPanel
          service={services.find((s) =>
            s.categories.some((c) => c.categoryId === selectedCategoryId)
          )}
          selectedCategory={selectedCategory}
          setModal={setModal}
          shopId={shopId}
          gstEnabled={gstEnabled}
          gstRate={gstRate}
          markupTiers={markupTiers}
        />
      ) : (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-gray-500">
          <p className="mb-4">No categories. Add one to get started.</p>
          <button
            onClick={() => {
              const svc = services.find((s) => s.serviceID === openServiceId);
              if (svc) {
                setModal({ type: "add-category", data: svc });
              }
            }}
            className="px-4 py-2 text-sm rounded bg-primary text-white hover:bg-primary/80"
          >
            + Add Category
          </button>
        </div>
      )}

      <ModalRenderer modal={modal} setModal={setModal} />
    </div>
  );
}
