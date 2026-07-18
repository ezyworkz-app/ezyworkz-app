import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getShopProfile } from "@/lib/actions/auth";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
    const profile = await getShopProfile();

    return (
        <ProtectedRoute>
            <main className="flex-1 p-8">
                <div className="mb-8 relative z-10">
                    <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
                    <p className="text-gray-500 mt-1">Manage your account settings and preferences.</p>
                </div>

                <ProfileForm profile={profile} />
            </main>
        </ProtectedRoute>
    );
}
