import React from "react";
import { TreeViewService } from "@/lib/actions/shopServices";
import { editShopServiceCategory } from "@/lib/actions/shopServices";
import ServiceMenu from "./ServiceMenu";
import CategoryMenu from "./CategoryMenu";
import AddServiceModal from "./AddServiceModal";
import AddCategoryModal from "./AddCategoryModal";
import Badge from "@/components/ui/Badge";
import AddItemModal from "./AddItemModal";
import EditItemModal from "./EditItemModal";
import EditServiceModal from "./EditServiceModal";
import AddAddonModal from "./AddAddonModal";
import ManageAddonsModal from "./ManageAddonsModal";
import { Modal } from "@/components/ui/modal";
import { Pencil } from "lucide-react";

interface Props {
  services: TreeViewService[];
  openServiceId: string | null;
  shopId: string;
  setOpenServiceId: (id: string | null) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string) => void;
  setModal: (modal: any) => void;
  refresh: () => void;
}

export default function ServiceSidebar({
  services,
  shopId,
  openServiceId,
  setOpenServiceId,
  selectedCategoryId,
  setSelectedCategoryId,
  setModal,
  refresh,
}: Props) {
  return (
    <aside className="w-80 bg-white border-r h-full flex flex-col shadow-sm">
      <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Services</h2>
        <button
          onClick={() =>
            setModal({
              type: "add-service",
              data: {
                component: (props: any) => (
                  <AddServiceModal shopId={shopId} {...props} />
                ),
              },
            })
          }
          className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all"
        >
          <span className="mr-1">+</span> Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
        {services.map((service) => {
          const isOpen = openServiceId === service.serviceID;
          return (
            <div
              key={service.serviceID}
              className={`rounded-xl border transition-all duration-200 ${
                isOpen
                  ? "bg-white shadow-md border-brand-100 ring-1 ring-brand-50"
                  : "bg-white border-gray-200 hover:border-brand-200 hover:shadow-sm"
              }`}
            >
              <div className="p-3 flex items-center justify-between gap-3">
                <button
                  className="flex-1 text-left group"
                  onClick={() =>
                    setOpenServiceId(isOpen ? null : service.serviceID)
                  }
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold transition-colors ${
                      isOpen ? "text-brand-600" : "text-gray-700 group-hover:text-brand-500"
                    }`}>
                      {service.name}
                    </span>
                    {!service.isActive && (
                      <Badge variant="neutral" className="ml-1 opacity-80">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {service.serviceID}
                  </p>
                </button>

                <ServiceMenu
                  onEdit={() =>
                    setModal({
                      type: "edit-service",
                      data: {
                        component: (props: any) => (
                          <EditServiceModal
                            shopId={shopId}
                            service={service}
                            closeModal={props.closeModal}
                          />
                        ),
                      },
                    })
                  }
                  onDelete={() =>
                    setModal({ type: "delete-service", data: service })
                  }
                  onAddCategory={() =>
                    setModal({
                      type: "add-category",
                      data: {
                        component: (props: any) => (
                          <AddCategoryModal
                            shopId={shopId}
                            service={service}
                            closeModal={props.closeModal}
                          />
                        ),
                      },
                    })
                  }
                  onAddAddon={() =>
                    setModal({
                      type: "add-addon",
                      data: {
                        component: (props: any) => (
                          <AddAddonModal
                            shopId={shopId}
                            serviceId={service.serviceID}
                            closeModal={props.closeModal}
                            onSuccess={() => {
                              refresh();
                              props.closeModal();
                            }}
                          />
                        ),
                      },
                    })
                  }
                  onManageAddons={() =>
                    setModal({
                      type: "manage-addons",
                      data: {
                        component: (props: any) => (
                                <ManageAddonsModal
                                  shopId={shopId}
                                  service={service}
                                  closeModal={props.closeModal}
                                  refresh={refresh}
                                />
                        ),
                      },
                    })
                  }
                />
              </div>

              {isOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-50 bg-gray-50/30 rounded-b-xl">
                  <div className="space-y-1.5 pt-2">
                    {service.categories.length > 0 ? (
                      service.categories.map((cat) => (
                        <div key={cat.categoryId} className="flex items-center group/cat">
                          <button
                            className={`flex-1 text-left text-sm rounded-lg px-3 py-2 transition-all duration-200 flex flex-col gap-0.5 ${
                              selectedCategoryId === cat.categoryId
                                ? "bg-brand-50 text-brand-700 font-medium ring-1 ring-brand-200 shadow-sm"
                                : "text-gray-600 hover:bg-white hover:shadow-sm hover:text-brand-600"
                            } ${cat.isActive === false ? "opacity-60" : ""}`}
                            onClick={() => setSelectedCategoryId(cat.categoryId)}
                          >
                            <span className={`flex items-center gap-1.5 ${cat.isActive === false ? "text-gray-400 italic font-normal" : ""}`}>
                              {cat.name}
                              {cat.isActive === false && (
                                <Badge variant="neutral" className="ml-1 opacity-80 text-[10px] bg-gray-100 border-none">
                                  Hidden
                                </Badge>
                              )}
                            </span>
                            <span className="text-[9px] text-gray-400 font-mono hidden group-hover/cat:inline-block">
                              {cat.categoryId}
                            </span>
                          </button>

                          <div className="opacity-0 group-hover/cat:opacity-100 transition-opacity ml-1">
                            <CategoryMenu
                              isActive={cat.isActive !== false}
                              onAddItem={() =>
                                setModal({
                                  type: "add-item",
                                  data: {
                                    component: (props: any) => (
                                      <AddItemModal
                                        shopId={shopId}
                                        service={service}
                                        category={cat}
                                        items={cat.items || []}
                                        closeModal={props.closeModal}
                                      />
                                    ),
                                  },
                                })
                              }
                              onEditCategory={() =>
                                setModal({ type: "edit-category", data: cat })
                              }
                              onDeleteCategory={() =>
                                setModal({ type: "delete-category", data: cat })
                              }
                              onToggleCategory={async () => {
                                try {
                                  await editShopServiceCategory(
                                    shopId,
                                    service.serviceID,
                                    cat.categoryId,
                                    { isActive: cat.isActive === false ? true : false }
                                  );
                                  refresh();
                                } catch (err) {
                                  console.error("Failed to toggle category:", err);
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center rounded-lg border border-dashed border-gray-200 bg-white/50">
                        <p className="text-xs text-gray-400 italic mb-2">No categories yet</p>
                        <button
                          onClick={() =>
                            setModal({
                              type: "add-category",
                              data: {
                                component: (props: any) => (
                                  <AddCategoryModal
                                    shopId={shopId}
                                    service={service}
                                    closeModal={props.closeModal}
                                  />
                                ),
                              },
                            })
                          }
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                        >
                          + Add First Category
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Addons Section */}
                  {service.addons && service.addons.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button 
                        onClick={() =>
                          setModal({
                            type: "manage-addons",
                            data: {
                              component: (props: any) => (
                                <ManageAddonsModal
                                  shopId={shopId}
                                  service={service}
                                  closeModal={props.closeModal}
                                  refresh={refresh}
                                />
                              ),
                            },
                          })
                        }
                        className="flex items-center justify-between mb-2 px-1 w-full group/addon-header hover:bg-gray-50 rounded p-1 transition-colors"
                      >
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover/addon-header:text-brand-500">
                          Service Addons
                        </span>
                        <Badge variant="neutral" className="text-[9px] px-1 bg-gray-100">
                          {service.addons.length}
                        </Badge>
                      </button>
                      <div className="grid grid-cols-1 gap-1.5">
                        {service.addons.map((addon: any) => (
                          <div
                            key={addon.shopServiceAddonId}
                            className="group/addon flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 hover:border-brand-200 transition-all shadow-sm cursor-pointer"
                            onClick={() =>
                              setModal({
                                type: "manage-addons",
                                data: {
                                  component: (props: any) => (
                                    <ManageAddonsModal
                                      shopId={shopId}
                                      service={service}
                                      closeModal={props.closeModal}
                                      refresh={refresh}
                                    />
                                  ),
                                },
                              })
                            }
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-[11px] font-bold text-gray-700 truncate">
                                {addon.name}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-brand-600 font-bold">
                                  ₹{addon.price ?? "—"}
                                </span>
                                {!addon.isActive && (
                                  <span className="text-[9px] text-gray-400 italic">
                                    Inactive
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="opacity-0 group-hover/addon:opacity-100 p-1 hover:bg-brand-50 rounded text-brand-500 transition-all">
                              <Pencil size={10} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
