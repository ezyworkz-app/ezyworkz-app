"use client"
import { useShop } from '@/context/ShopContext';
import { formatAssetUrl } from '@/utils/format';
import Head from 'next/head';
export const Favicon = () => {
  const { selectedShop } = useShop();
  if (!selectedShop?.faviconUrl) return null;
  const url = formatAssetUrl(selectedShop.faviconUrl);
  return (
    <Head>
      <link rel="icon" href={url} />
    </Head>
  );
};
