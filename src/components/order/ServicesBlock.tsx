"use client";
import ServiceAccordion from "./ServiceAccordion";
import { useCheckout } from "./CheckoutState";

export default function ServicesBlock() {
  const { grouped, deliveryBySvc, setDelivery, openBySvc, toggleOpen, fullDeliveryTypesBySvc } =
    useCheckout();
  return (
    <ul className="space-y-6">
      {grouped.map((s) => {
        const key = `${s.shopId}-${s.serviceId}`;
        // 🟢 Use full delivery types from API (all options) if available, else fall back to stored types
        const deliveryTypes = fullDeliveryTypesBySvc[key] ?? s.deliveryTypes;
        return (
          <ServiceAccordion
            key={key}
            svcKey={key}
            serviceName={s.serviceName}
            deliveryTypes={deliveryTypes}
            categories={s.categories}
            selectedKey={deliveryBySvc[key]}
            onDeliveryChange={(k) => setDelivery(key, k)}
            open={openBySvc[key]}
            toggleOpen={() => toggleOpen(key)}
          />
        );
      })}
    </ul>
  );
}
