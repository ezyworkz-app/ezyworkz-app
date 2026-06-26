"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import ShopOffersClient from "./ShopOffersClient";

export default function ShopOffersPage() {
    return (
        <ProtectedRoute>
            <ShopOffersClient />
        </ProtectedRoute>
    );
}
