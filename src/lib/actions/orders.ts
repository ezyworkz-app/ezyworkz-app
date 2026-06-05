"use server";
import { cookies } from "next/headers";
import { apiFetch } from "../api";
import { Order, OrderStatus, PaymentStatus } from "@/types/order";
import { revalidatePath } from "next/cache";
import { CreateOrderPayload } from "@/utils/cartToOrder";
import { DeliveryKey, DeliveryType } from "@/types/common";
import { getShopServiceById } from "./shops";
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
    shopSearch?: string
): Promise<{ 
    orders: Order[]; 
    nextKey?: string; 
    totalCount: number;
    globalCounts: Record<string, number>;
    priorityCounts: Record<string, number>;
}> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        let url = `/api/v1/admin/orders?limit=${limit}`;
        if (lastKey) url += `&lastKey=${encodeURIComponent(lastKey)}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;
        if (shopId) url += `&shopId=${encodeURIComponent(shopId)}`;
        if (userId) url += `&userId=${encodeURIComponent(userId)}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        if (sortOrder) url += `&sortOrder=${sortOrder}`;
        if (priority) url += `&priority=${priority}`;
        if (q) url += `&q=${encodeURIComponent(q)}`;
        if (userSearch) url += `&userSearch=${encodeURIComponent(userSearch)}`;
        if (shopSearch) url += `&shopSearch=${encodeURIComponent(shopSearch)}`;

        const res = await apiFetch(url);
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch orders");
        }

        return {
            orders: data.data.orders as Order[],
            nextKey: data.data.nextKey as string | undefined,
            totalCount: data.data.totalCount || 0,
            globalCounts: data.data.globalCounts || {},
            priorityCounts: data.data.priorityCounts || {}
        };
    } catch (error) {
        console.error("[getAllOrders]", error);
        return { orders: [], nextKey: undefined, totalCount: 0, globalCounts: {}, priorityCounts: {} };
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
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/admin/orders/details/${orderId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch order details");
        }

        return data.data.order as Order;
    } catch (error) {
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

    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/status`, {
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

    if (!orderId || !paymentStatus) {
        return { error: "Missing orderId or paymentStatus" };
    }

    try {
        const res = await apiFetch(
            `/api/v1/admin/orders/${orderId}/payment-status`,
            {
                method: "PATCH",
                body: JSON.stringify({ paymentStatus }),
            }
        );

        const result = await res.json();
        revalidatePath("/(admin)/orders", "page");

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
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/financials`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });

        const result = await res.json();
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
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/admin-notes`, {
            method: "PATCH",
            body: JSON.stringify({ adminNotes }),
        });

        const result = await res.json();
        revalidatePath("/(admin)/orders", "page");

        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to update admin notes");
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
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}/details`, {
            method: "PATCH",
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

    const res = await apiFetch("/api/v1/admin/orders/create", {
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
        const res = await apiFetch("/api/v1/admin/orders/calculate", {
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

            const deliveryTypes: Record<DeliveryKey, DeliveryType> =
                serviceData?.deliveryTypes ?? {
                    express: { priceMultiplier: 2, duration: "2 hours" },
                    oneDay: { priceMultiplier: 1.5, duration: "1 day" },
                    standard: { priceMultiplier: 1, duration: "2-3 days" },
                };

            const selectedDeliveryKey = Object.keys(svc.deliveryTypes ?? {})[0] as
                | DeliveryKey
                | undefined;

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
export async function deleteOrder(orderId: string) {
    if (!orderId) return { error: "Missing orderId" };

    try {
        const res = await apiFetch(`/api/v1/admin/orders/${orderId}`, {
            method: "DELETE",
        });

        const result = await res.json();
        
        if (!res.ok || !result.success) {
            throw new Error(result.message || "Failed to delete order");
        }

        revalidatePath("/(admin)/orders", "page");
        revalidatePath("/(admin)/orders/[orderId]", "page");
        
        return result;
    } catch (error: any) {
        console.error("[deleteOrder]", error);
        return { error: error.message || "Unexpected error" };
    }
}
