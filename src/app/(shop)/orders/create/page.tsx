import Link from "next/link";
import CreateOrderClient from "@/components/order/CreateOrderClient";

export const dynamic = "force-dynamic";

export default async function CreateOrderPage() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <CreateOrderClient />
    </div>
  );
}
