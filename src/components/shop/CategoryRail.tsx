"use client";
import { ShopCategory } from "@/types/shop-menu";

interface Props {
  categories: ShopCategory[];
  activeCategoryId: string | null;
  onSelect: (cat: ShopCategory) => void;
  cartCountByCategoryId?: Record<string, number>;
}

export default function CategoryRail({
  categories,
  activeCategoryId,
  onSelect,
  cartCountByCategoryId = {},
}: Props) {
  const noCats = categories.length === 0;

  return (
    <ul
      className="flex max-h-[calc(100vh-12rem)] w-[84px] md:w-48 shrink-0 flex-col gap-3 overflow-y-auto
                 rounded-tr-2xl bg-white p-4 pr-3
                 [&::-webkit-scrollbar]:hidden"
    >
      {noCats ? (
        <li className="text-center text-xs text-slate-500 opacity-70">
          No categories
        </li>
      ) : (
        categories.map((cat) => {
          const active = cat.shopServiceCategoryId === activeCategoryId;
          const count = cartCountByCategoryId[cat.shopServiceCategoryId] ?? 0;

          return (
            <li key={cat.shopServiceCategoryId}>
              <button
                onClick={() => onSelect(cat)}
                className={`group flex w-full items-center md:justify-start
                            md:flex-row flex-col gap-1 md:gap-3 text-xs md:text-sm font-medium
                            ${active
                    ? "text-black"
                    : "text-slate-600 hover:text-black"
                  }`}
              >
                {/* Circle avatar with badge */}
                <div className="relative shrink-0">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm
                                ${active
                        ? "border-black bg-black text-white shadow"
                        : "border-primary-300 group-hover:border-primary-400"
                      }`}
                  >
                    {cat.name[0]}
                  </div>
                  {/* 🟢 Cart count badge */}
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-green-500 text-white text-[9px] font-bold leading-none border border-white">
                      {count}
                    </span>
                  )}
                </div>

                {/* label */}
                <span
                  className={`truncate md:text-left ${active ? "" : "text-slate-600"}`}
                >
                  {cat.name}
                </span>
              </button>
            </li>
          );
        })
      )}
    </ul>
  );
}
