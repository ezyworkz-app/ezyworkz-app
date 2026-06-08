import { getPricingConfig } from "@/lib/actions/globals";
import PricingConfigClient from "./PricingConfigClient";

export const metadata = {
    title: "Pricing & Markup Management | Launezy",
};

export default async function PricingPage() {
    const config = await getPricingConfig();

    return (
        <div className="p-4 md:p-6">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">
                        Pricing & Markup Control
                    </h1>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-md border border-brand-500/20">
                        Global Config
                    </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage the dynamic platform fee tiers and markup logic applied to item prices.
                </p>
            </div>

            <PricingConfigClient initialConfig={config} />
        </div>
    );
}
