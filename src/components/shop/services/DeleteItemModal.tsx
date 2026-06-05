// components/modals/DeleteItemModal.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteShopItem as deleteShopItemAction } from "@/lib/actions/shopServices";

interface Props {
  shopId: string;
  service:
    | {
        serviceID: string;
        name?: string;
      }
    | any;
  category:
    | {
        categoryId: string;
        name: string;
      }
    | any;
  item: any;
  closeModal: () => void;
  onDeleted?: (deleted: any) => void;
}

export default function DeleteItemModal({
  shopId,
  service,
  category,
  item,
  closeModal,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemId =
    item?.shopServiceCategoryItemId ||
    item?.id ||
    item?.itemId ||
    item?.shopItemId;
  const serviceId = service?.serviceID || service?.id || service?.shopServiceId;
  const categoryId = category?.categoryId || category?.shopServiceCategoryId;

  const canDelete = Boolean(shopId && serviceId && categoryId && itemId);

  async function handleDelete(e?: React.FormEvent) {
    e?.preventDefault?.();

    if (!canDelete) {
      setError("Missing identifiers. Cannot delete this item.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // call server action (must be exported from a "use server" module)
      const result = await deleteShopItemAction(
        shopId,
        serviceId,
        categoryId,
        itemId
      );

      // optional callback
      onDeleted?.(result?.data ?? item);

      router.refresh();
      closeModal();
    } catch (err: any) {
      console.error("Delete item error:", err);
      setError(err?.message || "Failed to delete item");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleDelete} className="p-5 space-y-4 max-w-md">
      <h2 className="text-lg font-semibold text-center">Delete item</h2>

      <div className="text-sm text-gray-700">
        <p className="mb-1">
          Are you sure you want to permanently delete{" "}
          <strong>{item?.itemName ?? item?.name ?? "this item"}</strong> from{" "}
          <strong>{category?.name ?? category?.categoryName}</strong>?
        </p>
        <p className="text-xs text-gray-500">
          This action cannot be undone. If you want to hide it instead, consider
          setting the item <em>inactive</em>.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="bg-gray-300 rounded px-4 py-2"
          onClick={closeModal}
          disabled={submitting}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting || !canDelete}
          className="bg-red-600 text-white rounded px-4 py-2 disabled:opacity-60"
        >
          {submitting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </form>
  );
}
