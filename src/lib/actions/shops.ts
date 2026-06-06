"use server";
import { cookies } from "next/headers";
import { apiFetch } from "../api";
import { Shop } from "@/types/Shop";
import { revalidatePath } from "next/cache";
import { ShopCategory, ShopItem, ShopService } from "@/types/shop-menu";
import { ShopTiming } from "@/types/Shop";
export async function getAllShops(
    limit: number = 10,
    lastKey?: string,
    status?: string,
    sortBy: string = "createdAt",
    sortOrder: string = "desc"
): Promise<{ shops: Shop[], nextKey?: string, totalCount: number, statusCounts: Record<string, number> }> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");
 
        let url = `/api/v1/admin/shops?limit=${limit}`;
        if (lastKey) url += `&lastKey=${encodeURIComponent(lastKey)}`;
        if (status && status !== "all") url += `&status=${encodeURIComponent(status)}`;
        if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;
        if (sortOrder) url += `&sortOrder=${encodeURIComponent(sortOrder)}`;

        const res = await apiFetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch shops list");
        }

        return {
            shops: (data.data.shops || []) as Shop[],
            nextKey: data.data.nextKey,
            totalCount: data.data.totalCount || 0,
            statusCounts: data.data.statusCounts || {}
        };
    } catch (error) {
        console.error("[getAllShops]", error);
        return { shops: [], nextKey: undefined, totalCount: 0, statusCounts: {} };
    }
}

export async function getShopById(shopId: string): Promise<Shop | null> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/shops/${shopId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch shop details");
        }

        return data.data.shop as Shop;
    } catch (error) {
        console.error("[getShopById]", error);
        return null;
    }
}



// "use server";
// import { cookies } from "next/headers";
// import { apiFetch } from "../api";
// import { ShopCategory, ShopItem, ShopService } from "@/types/shop-menu";
// import { Shop } from "@/types/Shop";
// import { revalidatePath } from "next/cache";

// export async function getAllShops(): Promise<Shop[]> {
//     try {
//         const token = (await cookies()).get("accessToken")?.value;
//         if (!token) throw new Error("Not authenticated");

//         const res = await apiFetch(`/api/v1/admin/shops`, {
//             headers: { Authorization: `Bearer ${token}` },
//         });

//         const data = await res.json();

//         if (!res.ok || !data.success) {
//             throw new Error(data.message || "Failed to fetch shops list");
//         }

//         return data.data.shops as Shop[];
//     } catch (error) {
//         console.error("[getAllShops]", error);
//         return [];
//     }
// }

export async function getShopServiceById(
    shopServiceId: string,
    shopId: string
): Promise<ShopService | null> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(
            `/api/v1/shops/${shopId}/services/${shopServiceId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch shop service");
        }

        return (data.data.shopService || data.data) as ShopService;
    } catch (error) {
        console.error("[getShopServiceById]", error);
        return null;
    }
}
// export async function getShopById(shopId: string): Promise<Shop | null> {
//     try {
//         const token = (await cookies()).get("accessToken")?.value;
//         if (!token) throw new Error("Not authenticated");

//         const res = await apiFetch(`/api/v1/shops/${shopId}`, {
//             headers: { Authorization: `Bearer ${token}` },
//         });

//         const data = await res.json();

//         if (!res.ok || !data.success) {
//             throw new Error(data.message || "Failed to fetch shop details");
//         }

//         return data.data.shop as Shop;
//     } catch (error) {
//         console.error("[getShopById]", error);
//         return null;
//     }
// }

export async function fetchShopServices(
    shopId: string
): Promise<ShopService[]> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/shops/${shopId}/services`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await res.json();
        
        console.log("[fetchShopServices] data:", JSON.stringify(data, null, 2));
        
        let services: ShopService[] = [];
        
        // Handle different possible response structures
        if (data.data?.services) {
            services = data.data.services as ShopService[];
        } else if (Array.isArray(data.data)) {
            services = data.data as ShopService[];
        } else {
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to fetch shop services");
            }
            services = data.data.services as ShopService[];
        }

        // 🔵 Fallback: Fetch global services to get missing names
        try {
            const globalRes = await apiFetch(`/api/v1/global/services`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const globalData = await globalRes.json();
            const globalServices = globalData.data?.services || globalData.data || [];
            
            services = services.map(s => {
                if (!s.name || s.name.trim() === "") {
                    const globalSvc = globalServices.find((g: any) => g.globalServiceId === (s as any).globalServiceId);
                    if (globalSvc && globalSvc.name) {
                        return { ...s, name: globalSvc.name };
                    }
                }
                return s;
            });
        } catch (e) {
            console.error("Failed to fetch global services for names fallback", e);
        }

        return services;
    } catch (error) {
        console.error("[fetchShopServices]", error);
        return [];
    }
}
export async function fetchServiceCategories(
    shopId: string,
    shopServiceId: string
): Promise<ShopCategory[]> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(
            `/api/v1/shops/${shopId}/services/${shopServiceId}/categories`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await res.json();
        
        // Handle different possible response structures
        if (data.data?.categories) {
            return data.data.categories as ShopCategory[];
        } else if (Array.isArray(data.data)) {
            return data.data as ShopCategory[];
        }
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch service categories");
        }

        return data.data.categories as ShopCategory[];
    } catch (error) {
        console.error("[fetchServiceCategories]", error);
        return [];
    }
}
export async function fetchCategoryItems(
    shopId: string,
    shopServiceId: string,
    shopServiceCategoryId: string
): Promise<ShopItem[]> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(
            `/api/v1/shops/${shopId}/services/${shopServiceId}/categories/${shopServiceCategoryId}/items`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await res.json();
        console.log("[fetchCategoryItems] items data:", JSON.stringify(data, null, 2));
        
        // Handle different possible response structures
        if (data.data?.items) {
            return data.data.items as ShopItem[];
        } else if (Array.isArray(data.data)) {
            return data.data as ShopItem[];
        }
        
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch category items");
        }

        return data.data.items as ShopItem[];
    } catch (error) {
        console.error("[fetchCategoryItems]", error);
        return [];
    }
}

export async function updateShopStatus(formData: FormData) {
    const shopId = formData.get("shopId") as string;
    const shopStatus = formData.get("shopStatus") as string; // Or a `ShopStatus` enum if you have one
    // console.log("🔧 Received:", { shopId, shopStatus });

    try {
        const res = await apiFetch(`/api/v1/admin/shops/${shopId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: shopStatus }),
        });

        const result = await res.json();
        revalidatePath("/shops"); // or wherever the shop info appears
        // console.log(result);
        return result;
    } catch (error: any) {
        console.error("[updateShopStatus]", error);
        return { error: error.message || "Unexpected error" };
    }
}

export async function updateShopTiming(shopId: string, shopTiming: ShopTiming) {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/shops/${shopId}/timing`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ shopTiming }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to update shop timing");
        }

        revalidatePath(`/shops/${shopId}/details`);
        return { success: true, data: data.data };
    } catch (error: any) {
        console.error("[updateShopTiming]", error);
        return { success: false, error: error.message };
    }
}

export async function updateShopAvailability(
    shopId: string,
    updates: Partial<Pick<Shop, "isOpen" | "offDates" | "manualClosureReason">>
) {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/shops/${shopId}/availability`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(updates),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to update shop availability");
        }

        revalidatePath(`/shops/${shopId}/details`);
        return { success: true, data: data.data };
    } catch (error: any) {
        console.error("[updateShopAvailability]", error);
        return { success: false, error: error.message };
    }
}

/**
 * Update general shop details (name, phone, description, etc.)
 */
export async function updateShopDetails(
    shopId: string,
    updates: Partial<Shop>
) {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/shops/${shopId}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(updates),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to update shop details");
        }

        revalidatePath(`/shops/${shopId}/details`);
        return { success: true, data: data.data };
    } catch (error: any) {
        console.error("[updateShopDetails]", error);
        return { success: false, error: error.message };
    }
}

export async function updateShopAddress(
    shopId: string,
    address: any
) {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/shops/address/${shopId}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(address),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to update shop address");
        }

        revalidatePath(`/shops/${shopId}/details`);
        return { success: true, data: data.data };
    } catch (error: any) {
        console.error("[updateShopAddress]", error);
        return { success: false, error: error.message };
    }
}

export async function getShopKyc(shopId: string) {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/shops/${shopId}/kyc`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch KYC details");
        }

        return data.data;
    } catch (error) {
        console.error("[getShopKyc]", error);
        return null;
    }
}

export async function updateShopBankDetails(shopId: string, bankDetails: any) {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/shops/${shopId}/kyc/bank`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(bankDetails),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to update bank details");
        }

        revalidatePath(`/shops/${shopId}/details`);
        return { success: true, data: data.data };
    } catch (error: any) {
        console.error("[updateShopBankDetails]", error);
        return { success: false, error: error.message };
    }
}

export async function updateShopUpiDetails(shopId: string, upiDetails: any) {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/shops/${shopId}/kyc/upi-qr`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(upiDetails),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to update UPI details");
        }

        revalidatePath(`/shops/${shopId}/details`);
        return { success: true, data: data.data };
    } catch (error: any) {
        console.error("[updateShopUpiDetails]", error);
        return { success: false, error: error.message };
    }
}

export async function updateShopPanDetails(shopId: string, panDetails: { panCardNumber: string; panCardImageUrl?: string }) {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/shops/${shopId}/kyc/pan`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(panDetails),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to update PAN details");
        }

        revalidatePath(`/shops/${shopId}/details`);
        return { success: true, data: data.data };
    } catch (error: any) {
        console.error("[updateShopPanDetails]", error);
        return { success: false, error: error.message };
    }
}

export async function updateShopGstKycDetails(shopId: string, gstDetails: { gstNumber: string; gstCertificateUrl?: string }) {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/shops/${shopId}/kyc/gst`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify(gstDetails),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to update GST KYC details");
        }

        revalidatePath(`/shops/${shopId}/details`);
        return { success: true, data: data.data };
    } catch (error: any) {
        console.error("[updateShopGstKycDetails]", error);
        return { success: false, error: error.message };
    }
}

export async function uploadShopFile(shopId: string, file: File, fileType: string = "image"): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("shopId", shopId);
        formData.append("fileType", fileType);

        const res = await apiFetch(`/api/v1/shops/upload-file`, {
            method: "POST",
            headers: { 
                Authorization: `Bearer ${token}`,
                // Do NOT set Content-Type header when using FormData, 
                // fetch will set it correctly with the boundary
            },
            body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to upload file");
        }

        return { success: true, data: data.data };
    } catch (error: any) {
        console.error("[uploadShopFile]", error);
        return { success: false, error: error.message };
    }
}
