import { Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";
import GeneralClient from "./GeneralClient";

export default function GeneralSettingsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        }>
            <GeneralClient />
        </Suspense>
    );
}
