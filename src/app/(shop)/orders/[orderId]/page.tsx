import { getOrderByOrderId } from "@/lib/actions/orders";
import OrderDetailsClient from "./OrderDetailsClient";

export default async function OrderDetailsPage({
    params,
}: {
    params: Promise<{ orderId: string }>
}) {
    const { orderId } = await params;

    let initialOrder = null;
    let error = "";

    try {
        initialOrder = await getOrderByOrderId(orderId);
        if (!initialOrder) {
            error = "Order not found.";
        }
    } catch (err: any) {
        console.error("Failed to load order on server", err);
        error = err.message || "Failed to load order";
    }

    return <OrderDetailsClient initialOrder={initialOrder} orderId={orderId} error={error} />;
}
