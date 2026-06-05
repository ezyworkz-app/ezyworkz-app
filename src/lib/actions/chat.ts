"use server";

import { cookies } from "next/headers";
import { apiFetch } from "../api";

export interface Message {
    messageId: string;
    conversationId: string;
    senderId: string;
    senderType: "user" | "shop" | "system" | "admin";
    content: string;
    messageType: "text" | "image" | "order_update";
    images?: string[];
    read: boolean;
    createdAt: string;
}

export interface Conversation {
    conversationId: string;
    shopId: string;
    userId: string;
    orderId?: string;
    userName?: string;
    shopName?: string;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCountUser?: number;
    unreadCountShop?: number;
    unreadCountAdmin?: number;
    createdAt: string;
    updatedAt: string;
}

export async function getAllConversations(filters?: {
    userId?: string;
    shopId?: string;
    orderId?: string;
}): Promise<Conversation[]> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        let url = `/api/v1/admin/chat/conversations`;
        const params = new URLSearchParams();
        if (filters?.userId) params.append("userId", filters.userId);
        if (filters?.shopId) params.append("shopId", filters.shopId);
        if (filters?.orderId) params.append("orderId", filters.orderId);

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const res = await apiFetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch all conversations");
        }

        return data.data as Conversation[];
    } catch (error) {
        console.error("[getAllConversations]", error);
        return [];
    }
}

export async function createOrGetConversation(userId: string, shopId: string, orderId?: string): Promise<Conversation | null> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/chat/conversations`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, shopId, orderId }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to create or get conversation");
        }

        return data.data as Conversation;
    } catch (error) {
        console.error("[createOrGetConversation]", error);
        return null;
    }
}

export async function getShopConversations(shopId: string): Promise<Conversation[]> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/chat/conversations/shop/${shopId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch conversations");
        }

        return data.data as Conversation[];
    } catch (error) {
        console.error("[getShopConversations]", error);
        return [];
    }
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/chat/conversations/${conversationId}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to fetch messages");
        }

        return (data.data.messages || []) as Message[];
    } catch (error) {
        console.error("[getConversationMessages]", error);
        return [];
    }
}

export async function sendMessage(
    conversationId: string,
    content: string,
    messageType: "text" | "image" = "text",
    images: string[] = []
): Promise<Message | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;
        const senderId = cookieStore.get("id")?.value;

        if (!token || !senderId) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/chat/conversations/${conversationId}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content,
                messageType,
                images,
                senderId,
                senderType: "admin",
                senderName: "Support Admin"
            }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to send message");
        }

        return data.data as Message;
    } catch (error) {
        console.error("[sendMessage]", error);
        return null;
    }
}

export async function markMessagesAsRead(conversationId: string): Promise<boolean> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/chat/conversations/${conversationId}/read`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ readerType: "admin" })
        });

        const data = await res.json();
        return data.success;
    } catch (error) {
        console.error("[markMessagesAsRead]", error);
        return false;
    }
}

export async function uploadChatImage(formData: FormData): Promise<string | null> {
    try {
        const token = (await cookies()).get("accessToken")?.value;
        if (!token) throw new Error("Not authenticated");

        const res = await apiFetch(`/api/v1/chat/upload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to upload image");
        }

        return data.data.imageUrl as string;
    } catch (error) {
        console.error("[uploadChatImage]", error);
        return null;
    }
}
