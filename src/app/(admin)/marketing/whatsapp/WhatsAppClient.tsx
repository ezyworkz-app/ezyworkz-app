"use client";

import React, { useState } from "react";
import { sendWhatsAppReEngagement, sendWhatsAppTest } from "@/lib/actions/whatsapp";
import { CheckCircle, XCircle, Send, MessageCircle, Phone, AlertTriangle, Zap } from "lucide-react";

interface Props {
  initialConfig: {
    configured: boolean;
    valid?: boolean;
    phoneNumber?: string;
    error?: string;
  } | null;
}

function NotificationPreview({ name }: { name: string }) {
  return (
    <div className="bg-[#075E54] rounded-2xl p-4 max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">L</div>
        <div>
          <p className="text-white font-semibold text-sm">Launezy</p>
          <p className="text-white/60 text-xs">WhatsApp Business</p>
        </div>
      </div>
      <div className="bg-[#DCF8C6] rounded-xl rounded-tl-none px-3 py-2 max-w-xs">
        <p className="text-gray-800 text-sm leading-relaxed">
          Hi <strong>{name}</strong>, your laundry is still waiting! 🧺{" "}
          Use code <strong>TRYLAUNEZY</strong> to get ₹100 OFF your first Launezy order (min ₹200). Don't miss out!
        </p>
        <p className="text-gray-400 text-xs text-right mt-1">now ✓✓</p>
      </div>
    </div>
  );
}

export default function WhatsAppClient({ initialConfig }: Props) {
  const isReady = initialConfig?.configured && initialConfig?.valid;

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; noPhone: number; total: number; errors?: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [testPhone, setTestPhone] = useState("");
  const [testName, setTestName] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    setError(null);
    const res = await sendWhatsAppReEngagement();
    setSending(false);
    if (res) setResult(res);
    else setError("Campaign failed. Check server logs.");
  };

  const handleTest = async () => {
    if (!testPhone) return;
    setTestSending(true);
    setTestResult(null);
    const res = await sendWhatsAppTest(testPhone, testName);
    setTestSending(false);
    setTestResult(res ? "✅ Test message sent! Check your WhatsApp." : "❌ Failed to send test. Check logs.");
  };

  return (
    <div className="space-y-6">
      {/* Config status */}
      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
        isReady
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
      }`}>
        {isReady
          ? <CheckCircle size={18} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          : <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        }
        <div>
          {isReady ? (
            <>
              <p className="text-sm font-bold text-green-700 dark:text-green-400">WhatsApp Connected ✓</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                Sending from: <strong>{initialConfig?.phoneNumber}</strong>
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">WhatsApp Not Configured</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                {initialConfig?.error || "Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to your .env file."}
              </p>
              <div className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-400">
                <p className="font-semibold">Setup steps:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-amber-600 dark:text-amber-500">
                  <li>Go to <strong>developers.facebook.com</strong> → Create App → Business type</li>
                  <li>Add <strong>WhatsApp</strong> product → API Setup</li>
                  <li>Copy <strong>Phone Number ID</strong> and generate a <strong>Permanent Access Token</strong></li>
                  <li>Add to <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env</code>: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID</li>
                  <li>Create template named <strong>re_engagement_coupon</strong> with body: <em>"Hi {`{{1}}`}, your laundry is still waiting!..."</em></li>
                  <li>Wait for Meta approval (~24h), then come back here</li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Message preview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={17} className="text-[#25D366]" />
          <h3 className="font-bold text-gray-900 dark:text-white">Message Preview</h3>
        </div>
        <NotificationPreview name="Priya" />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Name is personalised per user · Template: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">re_engagement_coupon</code>
        </p>
      </div>

      {/* Test message */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-gray-400" />
          <h3 className="font-bold text-gray-900 dark:text-white">Send Test Message</h3>
        </div>
        <div className="flex gap-3 flex-wrap">
          <input
            value={testPhone}
            onChange={e => setTestPhone(e.target.value)}
            placeholder="Phone number (e.g. 9876543210)"
            className="flex-1 min-w-48 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            value={testName}
            onChange={e => setTestName(e.target.value)}
            placeholder="Name (optional)"
            className="w-40 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleTest}
            disabled={!testPhone || testSending || !isReady}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
          >
            <Send size={14} />
            {testSending ? "Sending…" : "Send Test"}
          </button>
        </div>
        {testResult && <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{testResult}</p>}
      </div>

      {/* Campaign */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={17} className="text-amber-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">Re-engagement Campaign</h3>
          <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full">No-token users only</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Fetches all-time abandoned checkout users from PostHog, cross-checks DynamoDB, and sends WhatsApp only to users
          who <strong>have no push token</strong> and <strong>have never ordered</strong>. Users with push tokens are handled by the push notification campaign.
        </p>

        <button
          onClick={handleSend}
          disabled={sending || !isReady}
          className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-green-500/20"
        >
          <MessageCircle size={16} />
          {sending ? "Sending…" : "Send WhatsApp to All No-Token Users"}
        </button>

        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-400">
              <CheckCircle size={16} /> Campaign complete
            </div>
            <div className="text-xs text-green-600 dark:text-green-500 space-y-0.5">
              <p>Total targeted: <strong>{result.total}</strong></p>
              <p>Sent: <strong>{result.sent}</strong> · Failed: <strong>{result.failed}</strong> · No phone number: <strong>{result.noPhone}</strong></p>
              {result.errors && result.errors.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-amber-600">Show errors ({result.errors.length})</summary>
                  <ul className="mt-1 space-y-0.5">
                    {result.errors.map((e, i) => <li key={i} className="font-mono text-xs">{e}</li>)}
                  </ul>
                </details>
              )}
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <XCircle size={16} />{error}
          </div>
        )}
      </div>
    </div>
  );
}
