import { verifyWhatsAppConfig } from "@/lib/actions/whatsapp";
import WhatsAppClient from "./WhatsAppClient";

export default async function WhatsAppPage() {
  const config = await verifyWhatsAppConfig();
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Re-engagement</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Reach users who abandoned checkout but have no push token — via WhatsApp Business API (Meta).
        </p>
      </div>
      <WhatsAppClient initialConfig={config} />
    </div>
  );
}
