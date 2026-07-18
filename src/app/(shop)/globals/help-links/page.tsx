import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getHelpLinksConfig } from "@/lib/actions/globals";
import HelpLinksClient from "./HelpLinksClient";

export const metadata = {
    title: "Help Links Configuration | Ezyworkz Admin",
    description: "Manage YouTube tutorial links for the Shop App",
};

export default async function HelpLinksPage() {
    const config = await getHelpLinksConfig();

    return (
        <div className="p-4 md:p-6">
            <PageBreadcrumb pageTitle="Shop App Help Links" />
            
            <div className="mt-6">
                <HelpLinksClient initialConfig={config} />
            </div>
        </div>
    );
}
