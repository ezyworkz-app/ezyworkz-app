// Common types for shops-web app

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface ShopOwner {
    shopOwnerId: string;
    email: string;
    name: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Shop {
    shopId: string;
    shopOwnerId: string;
    name: string;
    description?: string;
    address?: Address;
    phone?: string;
    email?: string;
    logo?: string;
    status: "pending_approval" | "active" | "suspended" | "rejected" | "inactive";
    createdAt: string;
    updatedAt: string;
}

export interface Address {
    area?: string;
    block?: string;
    city: string;
    country: string;
    houseNo: string;
    label: string;
    lat: number;
    lng: number;
    line1: string;
    pincode: string;
    state: string;
}

export interface User {
    userId: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ShopUser {
    userId: string;
    shopId: string;
    role: "owner" | "admin" | "manager" | "staff" | "user" | "customer" | "member";
    name?: string;
    joinedAt: string;
}

export interface ShopService {
    shopServiceId: string;
    shopId: string;
    name: string;
    description?: string;
    basePrice?: number;
    deliveryType?: Record<string, { duration: string; priceMultiplier: number }>;
    createdAt: string;
    updatedAt: string;
}

export interface ShopServiceCategory {
    shopServiceCategoryId: string;
    shopServiceId: string;
    name: string;
    order?: number;
    createdAt: string;
    updatedAt: string;
}

export interface ShopServiceCategoryItem {
    shopServiceCategoryItemId: string;
    shopServiceCategoryId: string;
    name: string;
    description?: string;
    price: number;
    unit?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ShopServiceAddon {
    shopServiceAddonId: string;
    shopServiceId: string;
    name: string;
    price: number;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Order {
    orderId: string;
    shopId: string;
    shopName?: string;
    userId: string;
    customerName: string;
    customerPhoneNumber?: string;
    status: string;
    paymentStatus: "pending" | "paid" | "failed" | "uncollectible";
    grandTotalPaid: number;
    baseAmount: number;
    taxAmount?: number;
    deliveryCharges?: number;
    discountAmount?: number;
    shopDiscountAmount?: number;
    lowCartFee?: number;
    services?: OrderService[];
    address?: Address;
    createdAt: string;
    updatedAt: string;
}

export interface OrderService {
    shopServiceId: string;
    serviceName: string;
    baseAmount: number;
    categories: OrderCategory[];
    deliveryType?: Record<string, { duration: string; priceMultiplier: number }>;
}

export interface OrderCategory {
    shopServiceCategoryId: string;
    categoryName: string;
    baseAmount: number;
    items: OrderItem[];
}

export interface OrderItem {
    shopServiceCategoryItemId: string;
    itemName: string;
    unitPrice: number;
    qty: number;
    unit?: string;
    itemSubtotal: number;
}

export interface Offer {
    offerId: string;
    shopId: string;
    shopName: string;
    title?: string;
    description?: string;
    code: string;
    type: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minOrderValue?: number;
    maxDiscountAmount?: number;
    templateType: string;
    startDate: string;
    endDate: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    offers?: T[];
    orders?: T[];
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    nextKey?: string;
    hasMore: boolean;
}
