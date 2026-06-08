import { getGlobalAddons } from "@/lib/actions/globals";
import GlobalAddonsClient from "./GlobalAddonsClient";

export const metadata = {
    title: "Global Addons | Launezy",
};

export default async function GlobalAddonsPage() {
    const addons = await getGlobalAddons();

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">
                    Global Addons
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage the master catalog of addons and their markup rules.
                </p>
            </div>

            <GlobalAddonsClient initialAddons={addons} />
        </div>
    );
}
