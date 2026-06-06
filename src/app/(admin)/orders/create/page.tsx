import Link from "next/link";
import CreateOrderCheckout from "@/components/order/CreateOrderCheckout";

export default function CreateOrderPage() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Order</h1>
        <Link
          href={`/orders`}
          className="inline-flex items-center rounded-md border border-gray-200 dark:border-white/10 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-white"
        >
          Cancel
        </Link>
      </div>

      <CreateOrderCheckout />
    </div>
  );
}
