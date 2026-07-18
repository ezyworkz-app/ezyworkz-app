import { getGlobalCategories } from "@/lib/actions/globals";
import GlobalCategoriesClient from "./GlobalCategoriesClient";

export const metadata = {
    title: "Global Categories | Ezyworkz",
};

export default async function GlobalCategoriesPage() {
    const categories = await getGlobalCategories();

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">
                    Global Categories
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage the master catalog of all item categories.
                </p>
            </div>

            <GlobalCategoriesClient initialCategories={categories} />
        </div>
    );
}
