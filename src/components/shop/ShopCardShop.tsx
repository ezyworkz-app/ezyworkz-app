"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { Shop } from "@/types/Shop";

const FALLBACK_SRC = "/placeholder_shop.jpg"; // put this file in /public

export default function ShopCardShop({ shop }: { shop: Shop }) {
  /* distance formatted to two decimals */
  const distanceLabel = useMemo(() => {
    if (shop.distanceKm === undefined) return null;
    return `${Number(shop.distanceKm).toFixed(2)} km`;
  }, [shop.distanceKm]);

  /* pick real image or fallback */
  const imgSrc = shop.imageUrl || FALLBACK_SRC;

  return (
    <div
      //   href={`/${shop.citySlug}/${shop.slug}`}
      className="
        group block overflow-hidden rounded-2xl border-2 m-4 lg:m-0 lg:mb-8 border-primary-200
        bg-white/70 transition hover:shadow-lg
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
      "
    >
      {/* ── Image ───────────────────────────────────────────── */}
      {/* <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={imgSrc}
          fill
          alt={shop.name}
          sizes="(min-width: 768px) 350px, 100vw"
          className="
            object-cover transition-transform duration-300
            group-hover:scale-105
          "
          priority
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
      </div> */}

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="space-y-1 px-4 pb-4 pt-3">
        <h2 className="font-semibold capitalize text-neutral-900 transition-colors group-hover:text-primary-600 md:text-lg">
          {shop.name}
        </h2>

        {(shop.address?.area || distanceLabel) && (
          <div className="flex flex-wrap items-center gap-1 text-sm capitalize text-gray-500 dark:text-gray-400">
            {shop.address?.area && <span>{shop.address.area}</span>}

            {shop.address?.area && distanceLabel && (
              <span className="mx-1 text-gray-400">·</span>
            )}

            {distanceLabel && (
              <span className="inline-block font-medium text-primary-700">
                {distanceLabel} away
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
