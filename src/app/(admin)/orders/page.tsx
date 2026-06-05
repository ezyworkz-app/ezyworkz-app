import { Metadata } from "next";
import OrdersClient from "@/components/orders/OrdersClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Orders | Launezy Admin",
    description: "Manage laundry orders",
};

export default function OrdersPage() {
    // Orders are fetched entirely client-side via useEffect in OrdersClient.
    // Passing empty initial values avoids a redundant SSR fetch that was being cached
    // by Next.js and occasionally serving stale/empty data.
    return (
        <div className="space-y-0">
            <OrdersClient
                initialOrders={[]}
                initialNextKey={undefined}
                initialTotalCount={0}
                initialGlobalCounts={{}}
            />
        </div>
    );
}
