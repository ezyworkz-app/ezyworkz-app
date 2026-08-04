"use server";
import { cookies } from "next/headers";
import { apiFetch } from "../api";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { revalidatePath } from "next/cache";
import { CreateOrderPayload } from "@/utils/cartToOrder";
import { DeliveryKey, DeliveryType } from "@/types/common";
import { getShopServiceById } from "./shops";

// Adapter: Map ezyworks-backend Order format to ezyworkz-admin-web Order format expected by the UI
const mapSingleOrder = (order: any): Order => {
    return {
        ...order,
        // 1. Map Customer info
        user: order.user || {
            name: order.customerName || "Unknown Customer",
            phoneNumber: order.customerPhoneNumber || "No Phone",
        },
        // 2. Map Services and Items
        services: (order.services || []).map((service: any) => ({
            ...service,
            // Map deliveryType to deliveryTypes
            deliveryTypes: service.deliveryTypes || service.deliveryType || {},
            selectedDeliveryKey: service.selectedDeliveryKey || (service.deliveryType ? Object.keys(service.deliveryType)[0] : undefined),
            categories: (service.categories || []).map((category: any) => ({
                ...category,
                items: (category.items || []).map((item: any) => ({
                    ...item,
                    totalPrice: item.totalPrice !== undefined ? item.totalPrice : item.itemTotal,
                    originalUnitPrice: item.originalUnitPrice !== undefined ? item.originalUnitPrice : item.unitPrice,
                })),
            })),
        })),
        // 3. Optional: Map other fields that might be missing but used in the UI
        shopPayout: order.shopPayout !== undefined ? order.shopPayout : (order.grandTotalPaid || 0),
    };
};
/* ─────────────────────────────────────────────── */
/* 🔹 Get all orders (Paginated)                  */
/* ─────────────────────────────────────────────── */
export async function getAllOrders(
    limit: number = 10,
    lastKey?: string,
    status?: string,
    shopId?: string,
    userId?: string,
    category?: string,
    sortOrder?: "asc" | "desc",
    priority?: string,
    q?: string,
    userSearch?: string,
    shopSearch?: string,
    source?: string
): Promise<{ 
    orders: Order[]; 
    nextKey?: string; 
    totalCount: number;
    globalCounts: Record<string, number>;
    statusCounts: Record<string, number>;
    priorityCounts: Record<string, number>;
}> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        let resolvedShopId = shopId || (await cookies()).get("id")?.value;
        if (!resolvedShopId) {
            try {
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                resolvedShopId = payload.id || payload.shopOwnerId;
            } catch (e) {
                console.warn("[getAllOrders] Failed to decode token to get shopId");
            }
        }

        let url = resolvedShopId 
            ? `/api/v1/shops/${resolvedShopId}/orders?limit=${limit}` 
            : `/api/v1/admin/orders?limit=${limit}`;
            
        if (lastKey) url += `&lastKey=${encodeURIComponent(lastKey)}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;
        // if shopId is provided, it's already in the path. Otherwise, we can pass it as a query parameter for admin search
        if (shopId && !url.includes('/shops/')) url += `&shopId=${encodeURIComponent(shopId)}`;
        if (userId) url += `&userId=${encodeURIComponent(userId)}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        if (sortOrder) url += `&sortOrder=${sortOrder}`;
        if (priority) url += `&priority=${priority}`;
        if (q) url += `&q=${encodeURIComponent(q)}`;
        if (userSearch) url += `&userSearch=${encodeURIComponent(userSearch)}`;
        if (shopSearch) url += `&shopSearch=${encodeURIComponent(shopSearch)}`;
        if (source) url += `&source=${encodeURIComponent(source)}`;

        const res = await apiFetch(url);
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch orders");
        }

        const isArray = Array.isArray(data.data);
        let rawOrdersList = isArray ? data.data : data.data.orders;

        // Ensure rawOrdersList is always an array
        if (!Array.isArray(rawOrdersList)) {
            console.error("[getAllOrders] Expected an array of orders, got:", rawOrdersList);
            return { orders: [], nextKey: undefined, totalCount: 0, globalCounts: {}, statusCounts: {}, priorityCounts: {} };
        }

        const mappedOrdersList = rawOrdersList.map(mapSingleOrder);

        const ordersList = mappedOrdersList;

        let totalCount = isArray ? ordersList.length : (data.data.totalCount || 0);
        let globalCounts = isArray ? undefined : (data.data.globalCounts || {});
        let statusCounts = isArray ? undefined : (data.data.statusCounts || globalCounts);
        let priorityCounts = isArray ? undefined : (data.data.priorityCounts || {});

        // Compute local if fallback logic
        if (!globalCounts || Object.keys(globalCounts).length === 0) {
            if (isArray) {
                globalCounts = {
                    all: 0,
                    user_paid: 0,
                    user_unpaid: 0,
                    shop_paid: 0,
                    shop_unpaid: 0,
                    waiting_confirmation: 0,
                    payment_pending: 0,
                    confirmed: 0,
                    in_pickup: 0,
                    in_process: 0,
                    ready_to_deliver: 0,
                    out_for_delivery: 0,
                    delivered: 0,
                    waiting_user_review: 0,
                    cancelled: 0,
                    scheduled: 0,
                    wait_refund: 0,
                    uncollectible: 0,
                };
                priorityCounts = { all: 0 };
                statusCounts = { ...globalCounts };

                for (const item of ordersList) {
                    globalCounts.all++;
                    
                    const s = item.status;
                    const ps = item.paymentStatus;
                    const sp = item.shopPayout || 0;
                    
                    const paidAmt = (item.amountPaid || 0);
                    const totalAmt = item.grandTotalPaid || 0;
                    const isFullyPaid = ps === "paid" || (totalAmt > 0 && paidAmt >= totalAmt - 0.05);
                    const isOverpaid = totalAmt > 0 && paidAmt > totalAmt + 0.05;

                    if (s !== "cancelled") {
                        if (ps === "uncollectible") {
                            globalCounts.uncollectible++;
                        } else {
                            if (isFullyPaid) {
                                globalCounts.user_paid++;
                                if (ps === "paid") {
                                    if (sp > 0) globalCounts.shop_paid++;
                                    else globalCounts.shop_unpaid++;
                                }
                            } else {
                                globalCounts.user_unpaid++;
                            }
                            if (isOverpaid) {
                                globalCounts.wait_refund++;
                            }
                        }
                    }

                    if (s && globalCounts[s] !== undefined) {
                        globalCounts[s]++;
                        statusCounts[s]++;
                    }

                    const service = item.services?.[0];
                    const key = service?.selectedDeliveryKey || (service?.deliveryTypes ? Object.keys(service.deliveryTypes)[0] : null);
                    if (key) {
                        if (priorityCounts[key] === undefined) priorityCounts[key] = 0;
                        priorityCounts[key]++;
                        priorityCounts.all++;
                    }

                    if (item.deliveryScheduledAt && s !== "cancelled" && s !== "delivered") {
                        globalCounts.scheduled++;
                        statusCounts.scheduled++;
                    }
                }
            }
        }

        return {
            orders: ordersList as Order[],
            nextKey: isArray ? undefined : data.data.nextKey as string | undefined,
            totalCount,
            globalCounts: globalCounts || {},
            statusCounts: statusCounts || globalCounts || {},
            priorityCounts: priorityCounts || {}
        };
    } catch (error) {
        console.error("[getAllOrders] Error:", error);
        return { orders: [], nextKey: undefined, totalCount: 0, globalCounts: {}, statusCounts: {}, priorityCounts: {} };
    }
}


/* ─────────────────────────────────────────────── */
/* 🔹 Get order by ID                             */
/* ─────────────────────────────────────────────── */
export async function getOrderByOrderId(
    orderId: string
): Promise<Order | null> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        let shopId = (await cookies()).get("id")?.value;
        
        if (!token) throw new Error("Not authenticated");

        // Fallback: If shopId cookie is missing, decode the token payload
        if (!shopId) {
            try {
                const payloadStr = Buffer.from(token.split('.')[1], 'base64').toString();
                const payload = JSON.parse(payloadStr);
                shopId = payload.id || payload.shopOwnerId || payload.shopId;
                if (!shopId) {
                    throw new Error(`[DEBUG] Token decoded but no shopId found. Payload: ${payloadStr}`);
                }
            } catch (e: any) {
                if (e.message.includes("[DEBUG]")) throw e;
                throw new Error(`[DEBUG] Failed to decode token: ${e.message}`);
            }
        }
        
        const url = shopId 
            ? `/api/v1/shops/${shopId}/orders/${orderId}`
            : `/api/v1/admin/orders/details/${orderId}`;
            
        const res = await apiFetch(url);
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch order details");
        }

        const orderData = data.data.order || data.data;

        return mapSingleOrder(orderData) as Order;
    } catch (error: any) {
        // Forward the DEBUG error so it shows up in the UI overlay
        if (error.message?.includes("[DEBUG]")) {
            throw error;
        }
        console.error("[getOrderByOrderId]", error);
        return null;
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Update order status                         */
/* ─────────────────────────────────────────────── */
export async function updateOrderStatus(formData: FormData) {
    const orderId = formData.get("orderId") as string;
    const orderStatus = formData.get("orderStatus") as OrderStatus;
    const cancelReason = formData.get("cancelReason") as string;
    const shopId = formData.get("shopId") as string;

    try {
        const url = shopId 
            ? `/api/v1/shops/${shopId}/orders/${orderId}/status`
            : `/api/v1/admin/orders/${orderId}/status`;
            
        const res = await apiFetch(url, {
            method: "PATCH",
            body: JSON.stringify({ 
                status: orderStatus,
                cancelReason: cancelReason || undefined
            }),
        });

        const result = await res.json();

        return result;
    } catch (error: any) {
        console.error("[updateOrderStatus]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Update order payment status                 */
/* ─────────────────────────────────────────────── */
export async function updateOrderPaymentStatus(formData: FormData) {
    const orderId = formData.get("orderId") as string;
    const paymentStatus = formData.get("paymentStatus") as PaymentStatus;
    const shopId = formData.get("shopId") as string;

    if (!orderId || !paymentStatus) {
        return { error: "Missing orderId or paymentStatus" };
    }

    try {
        const url = shopId 
            ? `/api/v1/shops/${shopId}/orders/${orderId}/payment`
            : `/api/v1/admin/orders/${orderId}/payment-status`;
            
        const res = await apiFetch(url, {
                method: "PATCH",
                body: JSON.stringify({ paymentStatus }),
            }
        );

        const result = await res.json();
        revalidatePath("/orders");

        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update payment status");
        }

        return result;
    } catch (error: any) {
        console.error("[updateOrderPaymentStatus]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Update order financials                     */
/* ─────────────────────────────────────────────── */
export async function updateOrderFinancials(formData: FormData) {
    const orderId = formData.get("orderId") as string;
    
    if (!orderId) {
        return { error: "Missing orderId" };
    }

    // Extract only if present in FormData to avoid accidental resets
    const payload: any = {};
    const fields = ["compensationAmount", "shopPayout", "logisticsCost", "shopLogisticsCost", "discountAmount"];
    
    fields.forEach(field => {
        const value = formData.get(field);
        if (value !== null) {
            payload[field] = Number(value);
        }
    });

    try {
        const token = (await cookies()).get("accessToken")?.value;
        let shopId = (await cookies()).get("id")?.value;
        
        if (!token) throw new Error("Not authenticated");

        if (!shopId) {
            try {
                const payloadStr = Buffer.from(token.split('.')[1], 'base64').toString();
                const jwtPayload = JSON.parse(payloadStr);
                shopId = jwtPayload.id || jwtPayload.shopOwnerId || jwtPayload.shopId;
            } catch (e: any) {
                console.error("Failed to decode token", e);
            }
        }

        if (!shopId) throw new Error("Shop ID is required for shop operations.");
        const url = `/api/v1/shops/${shopId}/orders/${orderId}/financials`;

        const res = await apiFetch(url, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });

        const result = await res.json();
        revalidatePath("/(app)/orders", "page");
        revalidatePath("/(admin)/orders", "page");

        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update financials");
        }

        return result;
    } catch (error: any) {
        console.error("[updateOrderFinancials]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Update order admin notes                    */
/* ─────────────────────────────────────────────── */
export async function updateOrderAdminNotes(orderId: string, adminNotes: string) {
    if (!orderId) {
        return { error: "Missing orderId" };
    }

    try {
        const token = (await cookies()).get("accessToken")?.value;
        let shopId = (await cookies()).get("id")?.value;
        
        if (!shopId && token) {
            try {
                const payloadStr = Buffer.from(token.split('.')[1], 'base64').toString();
                const jwtPayload = JSON.parse(payloadStr);
                shopId = jwtPayload.id || jwtPayload.shopOwnerId || jwtPayload.shopId;
            } catch (e: any) {
                console.error("Failed to decode token", e);
            }
        }

        const url = shopId 
            ? `/api/v1/shops/${shopId}/orders/${orderId}/shop-notes`
            : `/api/v1/shops/default/orders/${orderId}/shop-notes`;

        const res = await apiFetch(url, {
            method: "PATCH",
            body: JSON.stringify({ adminNotes }),
        });

        const result = await res.json();
        revalidatePath("/(shop)/orders", "page");
        revalidatePath("/orders", "page");

        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update shop notes");
        }

        return result;
    } catch (error: any) {
        console.error("[updateOrderAdminNotes]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Update Rapido OTP & rider details           */
/* ─────────────────────────────────────────────── */
export async function updateRiderAssignment(
    orderId: string,
    payload: {
        rapidoOtp?: string;
        rapidoRiderName?: string;
        rapidoBookingId?: string;
        deliveryPayoutAmount?: number;
        status?: string;
    }
) {
    if (!orderId) return { error: "Missing orderId" };

    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/details`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });

        const result = await res.json();
        revalidatePath("/(admin)/orders", "page");

        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update rider assignment");
        }

        return result;
    } catch (error: any) {
        console.error("[updateRiderAssignment]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Reassign order to another shop             */
/* ─────────────────────────────────────────────── */
export async function reassignOrder(
    orderId: string,
    payload: {
        toShopId: string;
        toShopName: string;
        reason: string;
        notes?: string;
        notifyUser?: boolean;
    }
) {
    if (!orderId) {
        return { error: "Missing orderId" };
    }

    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/reassign`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });

        const result = await res.json();
        revalidatePath("/(admin)/orders", "page");
        revalidatePath(`/(admin)/orders/details/${orderId}`, "page");

        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to reassign order");
        }

        return result;
    } catch (error: any) {
        console.error("[reassignOrder]", error);
        return { error: error.message || "Unexpected error" };
    }
}



// "use server";
// import { cookies } from "next/headers";
// import { apiFetch } from "../api";
// import { Order, OrderStatus, PaymentStatus } from "@/types/order";
// import { revalidatePath } from "next/cache";
// import { CreateOrderPayload } from "@/utils/cartToOrder";
// import { DeliveryKey, DeliveryType } from "@/types/common";
// import { getShopServiceById } from "./shops";


// /* ─────────────────────────────────────────────── */
// /* 🔹 Get order by ID                             */
// /* ─────────────────────────────────────────────── */
// export async function getOrderByOrderId(
//     orderId: string
// ): Promise<Order | null> {
//     try {
//         const token = (await cookies()).get("accessToken")?.value;
//         if (!token) throw new Error("Not authenticated");

//         const res = await apiFetch(`/api/v1/admin/orders/details/${orderId}`);
//         const data = await res.json();
//         if (!res.ok || !data.success) {
//             throw new Error(data.message || "Failed to fetch order details");
//         }

//         return data.data.order as Order;
//     } catch (error) {
//         console.error("[getOrderByOrderId]", error);
//         return null;
//     }
// }

// /* ─────────────────────────────────────────────── */
// /* 🔹 Update order status                         */
// /* ─────────────────────────────────────────────── */
// export async function updateOrderStatus(formData: FormData) {
//     const orderId = formData.get("orderId") as string;
//     const orderStatus = formData.get("orderStatus") as OrderStatus;

//     try {
//         const res = await apiFetch(`/api/v1/admin/orders/${orderId}/status`, {
//             method: "PATCH",
//             body: JSON.stringify({ status: orderStatus }),
//         });

//         const result = await res.json();
//         revalidatePath("/admin/orders");

//         return result;
//     } catch (error: any) {
//         console.error("[updateOrderStatus]", error);
//         return { error: error.message || "Unexpected error" };
//     }
// }

// /* ─────────────────────────────────────────────── */
// /* 🔹 Update order payment status                 */
// /* ─────────────────────────────────────────────── */
// export async function updateOrderPaymentStatus(formData: FormData) {
//     const orderId = formData.get("orderId") as string;
//     const paymentStatus = formData.get("paymentStatus") as PaymentStatus;

//     if (!orderId || !paymentStatus) {
//         return { error: "Missing orderId or paymentStatus" };
//     }

//     try {
//         const res = await apiFetch(
//             `/api/v1/admin/orders/${orderId}/payment-status`,
//             {
//                 method: "PATCH",
//                 body: JSON.stringify({ paymentStatus }),
//             }
//         );

//         const result = await res.json();
//         revalidatePath("/admin/orders");

//         if (!res.ok || !result.success) {
//             throw new Error(result.message || "Failed to update payment status");
//         }

//         return result;
//     } catch (error: any) {
//         console.error("[updateOrderPaymentStatus]", error);
//         return { error: error.message || "Unexpected error" };
//     }
// }

// /* ─────────────────────────────────────────────── */
// /* 🔹 Update order financials (NEW)               */
// /* ─────────────────────────────────────────────── */
// export async function updateOrderFinancials(formData: FormData) {
//     const orderId = formData.get("orderId") as string;
//     const compensationAmount = Number(formData.get("compensationAmount") || 0);
//     const shopPayout = Number(formData.get("shopPayout") || 0);
//     const logisticsCost = Number(formData.get("logisticsCost") || 0);

//     if (!orderId) {
//         return { error: "Missing orderId" };
//     }

//     try {
//         const res = await apiFetch(`/api/v1/admin/orders/${orderId}/financials`, {
//             method: "PATCH",
//             body: JSON.stringify({
//                 compensationAmount,
//                 shopPayout,
//                 logisticsCost,
//             }),
//         });

//         const result = await res.json();
//         revalidatePath("/admin/orders");

//         if (!res.ok || !result.success) {
//             throw new Error(result.message || "Failed to update financials");
//         }

//         return result;
//     } catch (error: any) {
//         console.error("[updateOrderFinancials]", error);
//         return { error: error.message || "Unexpected error" };
//     }
// }

// /* ─────────────────────────────────────────────── */
// /* 🔹 Update order admin notes                    */
// /* ─────────────────────────────────────────────── */
// export async function updateOrderAdminNotes(orderId: string, adminNotes: string) {
//   if (!orderId) {
//     return { error: "Missing orderId" };
//   }

//   try {
//     const res = await apiFetch(`/api/v1/admin/orders/${orderId}/details`, {
//       method: "PATCH",
//       body: JSON.stringify({ adminNotes }),
//     });

//     const result = await res.json();
//     revalidatePath("/admin/orders");

//     if (!res.ok || !result.success) {
//       throw new Error(result.message || "Failed to update admin notes");
//     }

//     return result;
//   } catch (error: any) {
//     console.error("[updateOrderAdminNotes]", error);
//     return { error: error.message || "Unexpected error" };
//   }
// }

/* ─────────────────────────────────────────────── */
/* 🔹 Update order details by admin               */
/* ─────────────────────────────────────────────── */
export async function updateOrderDetailsByAdmin(
    orderId: string,
    payload: CreateOrderPayload
) {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) return { error: "You must be logged in." };

    try {
        const res = await apiFetch(`/api/v1/shops/${payload.shopId}/orders/${orderId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update order");
        }

        revalidatePath("/orders");
        return result;
    } catch (error: any) {
        console.error("[updateOrderDetailsByAdmin]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🏗️ Update fulfillment cart by admin           */
/* ─────────────────────────────────────────────── */
/**
 * Updates ONLY the fulfillment cart (Shop B payout)
 */
export async function updateFulfillmentCartByAdmin(
    orderId: string,
    payload: { fulfillmentCart: any[]; fulfillmentStatus: string }
) {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) return { error: "You must be logged in." };

    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/fulfillment`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update fulfillment cart");
        }

        revalidatePath("/orders");
        revalidatePath(`/(admin)/orders/${orderId}`, "page");
        return result;
    } catch (error: any) {
        console.error("[updateFulfillmentCartByAdmin]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Create new order (admin)                    */
/* ─────────────────────────────────────────────── */
export async function createOrder(payload: CreateOrderPayload) {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) return { error: "You must be logged in." };

    const res = await apiFetch(`/api/v1/shops/${payload.shopId}/orders`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function calculateOrderBreakdown(payload: any) {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) return { error: "You must be logged in." };

    try {
        const res = await apiFetch(`/api/v1/shops/${payload.shopId}/orders/calculate`, {
            method: "POST",
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        return data;
    } catch (error: any) {
        console.error("[calculateOrderBreakdown]", error);
        return { success: false, message: error.message };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Enrich order with delivery types            */
/* ─────────────────────────────────────────────── */
export async function enrichOrderWithDeliveryTypes(order: Order) {
    const enrichedServices = await Promise.all(
        order.services.map(async (svc) => {
            const serviceData = await getShopServiceById(
                svc.shopServiceId,
                order.shopId
            );

            const defaultDeliveryTypes = {
                express: { priceMultiplier: 2, duration: "2 hours" },
                oneDay: { priceMultiplier: 1.5, duration: "1 day" },
                standard: { priceMultiplier: 1, duration: "2-3 days" },
            };

            const historicalDeliveryTypes = (svc as any).deliveryType || svc.deliveryTypes || {};
            const selectedDeliveryKey = Object.keys(historicalDeliveryTypes)[0] as DeliveryKey | undefined;

            const deliveryTypes: Record<DeliveryKey, DeliveryType> = {
                ...(serviceData?.deliveryTypes ?? defaultDeliveryTypes),
                ...historicalDeliveryTypes
            };

            return {
                ...svc,
                deliveryTypes,
                selectedDeliveryKey,
            };
        })
    );

    return {
        ...order,
        services: enrichedServices,
    };
}

/* ─────────────────────────────────────────────── */
/* 🔹 Trigger Porter Job (Manual)                */
/* ─────────────────────────────────────────────── */
export async function triggerPorterAction(orderId: string, type: "pickup" | "delivery") {
    if (!orderId) return { error: "Missing orderId" };

    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/trigger-porter`, {
            method: "POST",
            body: JSON.stringify({ type }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || `Failed to trigger ${type}`);
        }

        return result;
    } catch (error: any) {
        console.error("[triggerPorterAction]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Cancel Porter Job (Manual)                */
/* ─────────────────────────────────────────────── */
export async function cancelPorterAction(orderId: string, type: "pickup" | "delivery") {
    if (!orderId) return { error: "Missing orderId" };

    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/cancel-porter`, {
            method: "POST",
            body: JSON.stringify({ type }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || `Failed to cancel ${type}`);
        }

        return result;
    } catch (error: any) {
        console.error("[cancelPorterAction]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Update order logistics type                */
/* ─────────────────────────────────────────────── */
export async function updateOrderLogisticsType(orderId: string, isShopLogistics: boolean) {
    if (!orderId) return { error: "Missing orderId" };

    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/details`, {
            method: "PATCH",
            body: JSON.stringify({ isShopLogistics }),
        });

        const result = await res.json();
        revalidatePath(`/(admin)/orders/${orderId}`, "page");

        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update logistics type");
        }

        return result;
    } catch (error: any) {
        console.error("[updateOrderLogisticsType]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Update order chat notification toggle      */
/* ─────────────────────────────────────────────── */
export async function updateOrderChatType(orderId: string, isShopChatEnabled: boolean) {
    if (!orderId) return { error: "Missing orderId" };

    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/details`, {
            method: "PATCH",
            body: JSON.stringify({ isShopChatEnabled }),
        });

        const result = await res.json();
        revalidatePath(`/(admin)/orders/${orderId}`, "page");

        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update chat notification type");
        }

        return result;
    } catch (error: any) {
        console.error("[updateOrderChatType]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Refund overpayment to user wallet          */
/* ─────────────────────────────────────────────── */
export async function refundOverpaidAmount(orderId: string) {
    if (!orderId) return { error: "Missing orderId" };

    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/refund-overpayment`, {
            method: "POST",
        });

        const result = await res.json();
        revalidatePath("/(admin)/orders", "page");

        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to refund overpayment");
        }

        return result;
    } catch (error: any) {
        console.error("[refundOverpaidAmount]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Trigger Cashfree refund (original source)  */
/* ─────────────────────────────────────────────── */
export async function refundViaCashfree(orderId: string) {
    if (!orderId) return { error: "Missing orderId" };
    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/refund-via-cashfree`, { method: "POST" });
        const result = await res.json();
        revalidatePath("/(admin)/orders", "page");
        if (!res.ok || !result.success) throw new Error(result.message || "Failed to trigger Cashfree refund");
        return result;
    } catch (error: any) {
        console.error("[refundViaCashfree]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Mark as manually refunded (cash/UPI)       */
/* ─────────────────────────────────────────────── */
export async function refundManual(orderId: string) {
    if (!orderId) return { error: "Missing orderId" };
    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/refund-manual`, { method: "POST" });
        const result = await res.json();
        revalidatePath("/(admin)/orders", "page");
        if (!res.ok || !result.success) throw new Error(result.message || "Failed to mark as manually refunded");
        return result;
    } catch (error: any) {
        console.error("[refundManual]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Verify Order Item Count (Admin)            */
/* ─────────────────────────────────────────────── */
/**
 * Triggers the specialized verify-item-count endpoint.
 * This triggers push notifications to the user identical to the shop app.
 */
export async function verifyOrderItemCount(orderId: string, count: number) {
    if (!orderId) return { error: "Missing orderId" };
    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/verify-item-count`, {
            method: "PATCH",
            body: JSON.stringify({ shopVerifiedItemCount: count }),
            headers: { "Content-Type": "application/json" },
        });

        const result = await res.json();
        revalidatePath("/(admin)/orders", "page");

        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to verify item count");
        }

        return result;
    } catch (error: any) {
        console.error("[verifyOrderItemCount]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Delete Order (Admin - Cancelled Only)       */
/* ─────────────────────────────────────────────── */
export async function deleteOrder(orderId: string, shopId?: string | null) {
    if (!orderId) return { error: "Missing orderId" };

    try {
        const url = shopId 
            ? `/api/v1/shops/${shopId}/orders/${orderId}`
            : `/api/v1/admin/orders/${orderId}`;
            
        const res = await apiFetch(url, {
            method: "DELETE",
        });

        if (res.status === 204) {
            revalidatePath("/orders", "page");
            return { success: true };
        }

        const result = await res.json();
        
        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to delete order");
        }

        revalidatePath("/orders", "page");
        
        return result;
    } catch (error: any) {
        console.error("[deleteOrder]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ─────────────────────────────────────────────── */
/* 🔹 Update Order Date                           */
/* ─────────────────────────────────────────────── */
export async function updateOrderDate(orderId: string, shopId: string, createdAt: string) {
    if (!orderId) return { error: "Missing orderId" };

    try {
        const res = await apiFetch(`/api/v1/shops/${shopId}/orders/${orderId}/date`, {
            method: "PATCH",
            body: JSON.stringify({ createdAt }),
        });

        const result = await res.json();
        
        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update order date");
        }

        revalidatePath("/orders", "page");
        
        return result;
    } catch (error: any) {
        console.error("[updateOrderDate]", error);
        return { error: error.message || "Unexpected error" };
    }
}

/* ------------------------------------------------------------------ */
/*  Update Order Token Number                                         */
/* ------------------------------------------------------------------ */
export async function updateOrderTokens(shopId: string, orderId: string, tokenNumbers: string[]) {
    const token = (await cookies()).get('accessToken')?.value;
    if (!token) throw new Error('Not authenticated');

    try {
        const res = await apiFetch(`/api/v1/shops/${shopId}/orders/${orderId}/token`, {
            method: 'PATCH',
            body: JSON.stringify({ tokenNumbers }),
        });

        const result = await res.json();
        revalidatePath('/(app)/orders', 'page');
        revalidatePath('/(admin)/orders', 'page');

        if (!res.ok || !result.success) {
            throw new Error(result.message || 'Failed to update token numbers');
        }

        return result;
    } catch (error: any) {
        console.error('[updateOrderTokens]', error);
        return { error: error.message || 'Unexpected error' };
    }
}
