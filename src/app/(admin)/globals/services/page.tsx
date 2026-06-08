import { getGlobalServices } from "@/lib/actions/globals";
import GlobalServicesClient from "./GlobalServicesClient";

export const metadata = {
    title: "Global Services | Launezy",
};

export default async function GlobalServicesPage() {
    const services = await getGlobalServices();

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">
                    Global Services
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage the master catalog of all system-wide services.
                </p>
            </div>

            <GlobalServicesClient initialServices={services} />
        </div>
    );
}
