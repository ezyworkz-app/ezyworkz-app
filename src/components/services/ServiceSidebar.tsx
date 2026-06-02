"use client";

import { ChevronDown, ChevronRight, Plus, Settings2 } from "lucide-react";

interface Props {
  services: any[];
  openServiceId: string | null;
  setOpenServiceId: (id: string | null) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string) => void;
  setModal: (modal: any) => void;
}

export default function ServiceSidebar({
  services,
  openServiceId,
  setOpenServiceId,
  selectedCategoryId,
  setSelectedCategoryId,
  setModal,
}: Props) {
  return (
    <aside className="w-80 border-r border-card-border bg-[#0e1424] flex flex-col h-full z-10 flex-shrink-0">
      <div className="p-5 border-b border-card-border flex items-center justify-between bg-[#151c2f]">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Settings2 size={18} className="text-teal-400" />
            Config
        </h2>
        <button
          onClick={() => setModal({ type: "add-service" })}
          className="inline-flex items-center justify-center rounded-lg bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-400 hover:bg-teal-500/20 transition-colors border border-teal-500/20"
        >
          <Plus size={14} className="mr-1" /> Add Service
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {services.map((service, index) => {
          const svcId = service.shopServiceId || service.serviceID || service.id || `svc-${index}`;
          const isOpen = openServiceId === svcId;
          return (
            <div
              key={svcId}
              className={`rounded-xl border transition-all duration-200 ${
                isOpen
                  ? "bg-[#151c2f] border-teal-500/30"
                  : "bg-transparent border-card-border hover:border-slate-700"
              }`}
            >
              <div className="p-3 flex items-center justify-between gap-3">
                <button
                  className="flex-1 text-left flex items-center gap-2 group"
                  onClick={() => setOpenServiceId(isOpen ? null : svcId)}
                >
                  {isOpen ? (
                      <ChevronDown size={14} className="text-teal-400" />
                  ) : (
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300" />
                  )}
                  <span className={`font-semibold text-sm transition-colors ${
                    isOpen ? "text-teal-400" : "text-slate-300 group-hover:text-white"
                  }`}>
                    {service.name}
                  </span>
                </button>
                <button
                    onClick={() => setModal({ type: "edit-service", data: service })}
                    className="text-[10px] uppercase tracking-wider font-bold text-slate-500 hover:text-teal-400 transition-colors px-2 py-1 rounded bg-slate-800/50 hover:bg-slate-800"
                >
                    Edit
                </button>
              </div>

              {isOpen && (
                <div className="px-3 pb-3 pt-1">
                  <div className="space-y-1 pl-6 relative before:absolute before:left-[11px] before:top-0 before:bottom-2 before:w-px before:bg-card-border">
                    {(service.categories || []).length > 0 ? (
                      service.categories.map((cat: any, catIndex: number) => {
                        const catId = cat.shopServiceCategoryId || cat.categoryId || cat.id || `cat-${catIndex}`;
                        return (
                        <div key={catId} className="flex items-center relative">
                          <div className="absolute left-[-23px] top-1/2 w-3 h-px bg-card-border" />
                          <button
                            className={`flex-1 text-left text-sm rounded-lg px-3 py-2 transition-all duration-200 flex items-center justify-between ${
                              selectedCategoryId === catId
                                ? "bg-teal-500/10 text-teal-300 font-medium border border-teal-500/20"
                                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                            } ${cat.isActive === false ? "opacity-60" : ""}`}
                            onClick={() => setSelectedCategoryId(catId)}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              {cat.name}
                            </span>
                            {cat.isActive === false && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Hidden</span>
                            )}
                          </button>
                        </div>
                        );
                      })
                    ) : (
                      <div className="py-2 text-xs text-slate-500 italic pl-2">No categories found</div>
                    )}
                    
                    <div className="relative mt-2">
                        <div className="absolute left-[-23px] top-1/2 w-3 h-px bg-card-border" />
                        <button
                          onClick={() => setModal({ type: "add-category", data: service })}
                          className="w-full text-left flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 py-1.5 rounded border border-teal-500/20 transition-colors"
                        >
                          <Plus size={12} /> Add Category
                        </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {services.length === 0 && (
            <div className="text-center p-6 text-sm text-slate-500 bg-[#151c2f] rounded-xl border border-dashed border-slate-700">
                You haven't added any services yet.
            </div>
        )}
      </div>
    </aside>
  );
}
