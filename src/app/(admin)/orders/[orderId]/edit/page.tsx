import Link from "next/link";
import CheckoutClientPage from "@/components/order/CheckoutPage";
import { getOrderByOrderId, enrichOrderWithDeliveryTypes } from "@/lib/actions/orders";

type Params = { orderId: string };

export default async function EditOrderPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { orderId } = await params;

  const orderDetails = await getOrderByOrderId(orderId);
  if (!orderDetails) {
    return <div>Order not found or failed to load.</div>;
  }

  const enrichedOrder = await enrichOrderWithDeliveryTypes(orderDetails);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Order #{orderId}</h1>
        <Link
          href={`/orders`}
          className="inline-flex items-center rounded-md border border-gray-200 dark:border-white/10 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-white"
        >
          Cancel
        </Link>
      </div>

      <CheckoutClientPage order={enrichedOrder} />
    </div>
  );
}
