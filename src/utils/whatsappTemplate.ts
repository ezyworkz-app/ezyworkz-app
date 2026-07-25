import { Order } from "../types/order";

export const generateWhatsAppMessage = (order: Order, recipient: "user" | "shop", shopName?: string, invoiceUrl?: string): string => {
    const shop = shopName || order.shopName || "Shop";
    const orderId = order.orderId;
    const orderIdShort = order.orderId.slice(-6).toUpperCase();
    const userName = order.user?.name || (order as any).customerName || "there";
    const status = order.status;

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-IN", {
            month: "short", day: "numeric", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
        }).format(date);
    };

    const pickupTime = (status === "confirmed" && order.pickupScheduledAt)
        ? `\n  Scheduled: ${formatDate(order.pickupScheduledAt)}`
        : "";

    const userNote = order.notes ? `\n\nNote: ${order.notes}` : "";

    const totalItems = order.services ? order.services.reduce((total: number, service: any) => {
        return total + (service.categories ? service.categories.reduce((catTotal: number, category: any) => {
            return catTotal + (category.items ? category.items.reduce((itemTotal: number, item: any) => itemTotal + item.qty, 0) : 0);
        }, 0) : 0);
    }, 0) : 0;

    const servicesText = order.services ? order.services.map((service: any) => {
        const rawLabel = (service.selectedDeliveryKey || order.multiplierLabel || "standard").toLowerCase();
        let dKey = "Standard";
        if (rawLabel.includes("express")) dKey = "Express";
        else if (rawLabel.includes("oneday") || rawLabel.includes("one day")) dKey = "One Day";
        return `  \u2022 ${service.serviceName}  |  ${dKey}  |  \u20B9${Math.round(service.serviceTotal)}`;
    }).join("\n") : "";

    const servicesListShort = order.services ? order.services.map((s: any) => {
        const rawLabel = (s.selectedDeliveryKey || order.multiplierLabel || "standard").toLowerCase();
        let dKey = "Standard";
        if (rawLabel.includes("express")) dKey = "Express";
        else if (rawLabel.includes("oneday") || rawLabel.includes("one day")) dKey = "One Day";
        return `${s.serviceName} (${dKey})`;
    }).join(", ") : "";

    const rawMainLabel = order.services?.[0]
        ? (order.services[0].selectedDeliveryKey || order.multiplierLabel || "standard").toLowerCase()
        : "standard";
    let mainDeliveryType = "Standard";
    if (rawMainLabel.includes("express")) mainDeliveryType = "Express";
    else if (rawMainLabel.includes("oneday") || rawMainLabel.includes("one day")) mainDeliveryType = "One Day";

    const amountPaid = order.amountPaid || 0;
    const walletUsed = (order as any).walletAmountUsed || 0;
    const ezyUsed = (order as any).ezyAmountUsed || 0;
    const totalPaid = amountPaid + walletUsed + ezyUsed;
    const outstanding = Math.max(0, (order.grandTotalPaid || 0) - totalPaid);

    const footer = `\n\n_Powered by *EzyWorkz* \u2014 making laundry effortless._`;

    // ==========================================
    //  SHOP RECIPIENT — Operational, crisp
    // ==========================================
    if (recipient === "shop") {
        if (status === "confirmed") {
            const line2Text = order.address?.line2 && order.address.line2 !== "Not Provided" ? `, ${order.address.line2}` : "";
            const areaCityText = order.address?.area || order.address?.city || "";
            const addressText = `${order.address?.houseNo ? order.address.houseNo + ", " : ""}${order.address?.line1 || ""}${line2Text}${areaCityText ? `, ${areaCityText}` : ""}`;
            const mapsLink = (order.address?.lat && order.address?.lng)
                ? `https://www.google.com/maps/search/?api=1&query=${order.address.lat},${order.address.lng}`
                : "";
            const mapsLine = mapsLink ? `\n  Maps: ${mapsLink}` : "";
            return `*Pickup Request \u2014 Order #${orderIdShort}*

Hi *${shop}*,

A confirmed order is ready for pickup. Please arrange collection at your earliest.

*Customer Details*
  ${userName}
  ${order.user?.phoneNumber || (order as any).customerPhoneNumber || "N/A"}
  ${addressText}${mapsLine}${pickupTime}

*Services*
  ${servicesListShort}${userNote}

_Confirm pickup via the dashboard when collected._`;
        }

        if (status === "in_pickup") {
            return `*Order Received \u2014 #${orderIdShort}*

Hi *${shop}*,

The clothes for *${userName}* are on their way to you.

*Services to Process*
  ${servicesListShort}
  Turnaround: ${mainDeliveryType}${userNote}

_Please acknowledge receipt and begin processing._`;
        }

        if (status === "in_process") {
            return `*Processing Update Needed \u2014 #${orderIdShort}*

Hi *${shop}*,

Order for *${userName}* is currently with you.

*Services*
  ${servicesListShort}
  Turnaround: ${mainDeliveryType}

_Could you share an update on readiness? We need to schedule delivery._`;
        }

        if (status === "ready_to_deliver") {
            return `*Ready for Handover \u2014 #${orderIdShort}*

Hi *${shop}*,

Order for *${userName}* is marked ready. Our delivery partner will collect shortly.

*Services*
  ${servicesListShort}${userNote}

_Please ensure the order is packed and labelled. Thank you!_`;
        }

        return `*Order Update \u2014 #${orderIdShort}*

Hi *${shop}*, this is regarding an order for *${userName}* (Status: ${status.replace(/_/g, " ")}). Please update us on the progress when possible.`;
    }

    // ==========================================
    //  USER RECIPIENT — Brand voice, premium
    // ==========================================

    // ORDER CONFIRMATION (shop-placed or online)
    if (status === "in_process" || status === "waiting_confirmation" || status === "payment_pending") {
        const paymentLine = (order.paymentMethod as string) === "online" || order.paymentStatus === "paid"
            ? `Payment received \u2014 \u20B9${Math.round(order.grandTotalPaid)}`
            : `\u20B9${Math.round(order.grandTotalPaid)}  |  ${(order.paymentMethod || "cod").toUpperCase()} (${order.paymentStatus || "pending"})`;

        return `*Order Received \u2014 #${orderIdShort}*

Hi *${userName}*,

Your laundry is in good hands. Here's a quick summary of what we've got.

*What's Going In*
${servicesText}

*Order Info*
  Items: ${totalItems} pieces
  Ref: #${orderIdShort}
  ${paymentLine}

${invoiceUrl ? `*Full Invoice:*\n${invoiceUrl}\n` : ""}We'll keep you posted at every step \u2014 no need to follow up.

\u2014 *${shop}*${footer}`;
    }

    // CONFIRMED — awaiting pickup scheduling (user-placed orders, pickup via Rapido/Porter)
    if (status === "confirmed") {
        const pickupAddress = order.address
            ? `${order.address?.houseNo ? order.address.houseNo + ", " : ""}${order.address?.area || order.address?.city || "your address"}`
            : null;
        return `*Order Confirmed \u2014 #${orderIdShort}*

Hi *${userName}*,

Your order is confirmed and we're scheduling a pickup from your location.

To ensure a smooth pickup, please:

  1. Pack all your clothes in a bag or laundry sack
  2. Keep it ready at your door${pickupTime}${pickupAddress ? `\n  Pickup from: ${pickupAddress}` : ""}

Our pickup partner will arrive to collect your bag and bring it to our team.

Once done, reply here or wait for our next update!

\u2014 *${shop}*${footer}`;
    }

    // IN PICKUP
    if (status === "in_pickup") {
        return `*Partner On The Way \u2014 #${orderIdShort}*

Hi *${userName}*,

Our pickup partner is heading to you now. Please keep your bag ready at the door.

Any specific instructions? Reply here and we'll pass it along.

\u2014 *${shop}*${footer}`;
    }

    // READY TO DELIVER
    if (status === "ready_to_deliver") {
        const deliveryLine = order.address
            ? `Our delivery partner will reach you shortly. No need to do anything \u2014 we'll come to you.`
            : `Your fresh clothes are waiting at *${shop}*. Come by whenever you're ready.`;
        const paymentReminder = outstanding > 0.05
            ? `\n\n*Payment Due: \u20B9${outstanding.toFixed(2)}*\n_Please keep the amount ready for a smooth handover._`
            : `\n\n_Your account is settled. Nothing to pay!_`;
        return `*Your Laundry is Ready \u2014 #${orderIdShort}*

Hi *${userName}*,

Fresh, clean and ready to go.

${deliveryLine}${paymentReminder}

${invoiceUrl ? `*Invoice:* ${invoiceUrl}\n` : ""}\u2014 *${shop}*${footer}`;
    }

    // OUT FOR DELIVERY
    if (status === "out_for_delivery") {
        return `*Out for Delivery \u2014 #${orderIdShort}*

Hi *${userName}*,

Your order is on its way! Our partner will be at your doorstep soon.

Please keep ${outstanding > 0.05 ? `\u20B9${outstanding.toFixed(2)} ready for payment and ` : ""}your phone accessible in case they call.

${invoiceUrl ? `*Invoice:* ${invoiceUrl}\n` : ""}\u2014 *${shop}*${footer}`;
    }

    // DELIVERED
    if (status === "delivered") {
        if (outstanding > 0.05) {
            return `*Order Delivered \u2014 #${orderIdShort}*

Hi *${userName}*,

Your laundry has been delivered. Hope everything looks great!

*Outstanding: \u20B9${outstanding.toFixed(2)}*
_Kindly settle this at your earliest convenience._

${invoiceUrl ? `*Invoice:* ${invoiceUrl}\n` : ""}We'd love to hear your feedback \u2014 it helps us do better.

\u2014 *${shop}*${footer}`;
        }
        return `*Order Delivered \u2014 #${orderIdShort}*

Hi *${userName}*,

Your laundry has been delivered and your account is fully settled.

${invoiceUrl ? `*Invoice:* ${invoiceUrl}\n` : ""}We hope your clothes came back looking their best. See you next time!

\u2014 *${shop}*${footer}`;
    }

    // WAITING USER REVIEW
    if (status === "waiting_user_review") {
        return `*Your Review Needed \u2014 #${orderIdShort}*

Hi *${userName}*,

We've made some updates to your order's items or pricing. Please take a moment to review and approve them in the app so we can proceed without delay.

\u2014 *${shop}*${footer}`;
    }

    // CANCELLED
    if (status === "cancelled") {
        return `Order #${orderIdShort} has been cancelled, *${userName}*. If this wasn't expected or you have questions, reply here and we'll sort it out promptly.\n\n\u2014 *${shop}*`;
    }

    return `Hi *${userName}*, we have an update on your order #${orderIdShort}. Feel free to reply here if you need anything.\n\n\u2014 *${shop}*`;
};
