"use client";

import React, { useState, useEffect } from "react";
import {
  getShopWhatsAppConfigAction,
  updateShopWhatsAppConfigAction,
  testShopWhatsAppConfigAction,
  requestDedicatedNumberAction,
  handleWhatsAppOAuthAction,
} from "@/lib/actions/whatsapp";
import {
  CheckCircle2,
  Send,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
  Info,
  Loader2,
  Phone,
  Clock,
  CircleCheck,
  CircleDot,
  AlertCircle,
  ArrowRight,
  Link2,
  KeyRound,
  ExternalLink,
} from "lucide-react";

interface Props {
  shopId: string;
  shopName?: string;
  subdomain?: string;
}

type RequestStatus = "submitted" | "under_review" | "verified" | "active" | "rejected";
type CustomSubMode = "managed" | "coexistence";

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

export default function ShopWhatsAppSettings({ shopId, shopName = "Your Laundry Studio", subdomain = "thelaundrystudio" }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<"platform" | "custom">("platform");

  // Sub-mode for custom: "managed" (ezyworkz handles setup) or "coexistence" (self-service)
  const [customSubMode, setCustomSubMode] = useState<CustomSubMode>("managed");

  // Coexistence credentials
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  const [statuses, setStatuses] = useState<string[]>(["in_process", "ready_to_deliver", "delivered"]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Embedded Signup state
  const [fbSDKLoaded, setFbSDKLoaded] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const embeddedPhoneIdRef = React.useRef("");
  // waba_id / business_id also arrive in the WA_EMBEDDED_SIGNUP payload; the
  // server needs waba_id to subscribe webhooks.
  const embeddedWabaIdRef = React.useRef("");
  const embeddedBusinessIdRef = React.useRef("");

  // Dedicated number request state
  const [requestPhone, setRequestPhone] = useState("");
  const [requestDisplayName, setRequestDisplayName] = useState(shopName);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [dedicatedRequest, setDedicatedRequest] = useState<{
    phone: string;
    displayName: string;
    status: RequestStatus;
    submittedAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
  } | null>(null);

  // Test state
  const [testPhone, setTestPhone] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success?: boolean; msg?: string } | null>(null);

  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      const data = await getShopWhatsAppConfigAction(shopId);
      if (data) {
        setEnabled(data.enabled !== false);
        setMode(data.mode === "custom" ? "custom" : "platform");
        if (Array.isArray(data.statuses)) setStatuses(data.statuses);
        if (data.dedicatedNumberRequest) {
          setDedicatedRequest(data.dedicatedNumberRequest);
          setRequestPhone(data.dedicatedNumberRequest.phone || "");
          setRequestDisplayName(data.dedicatedNumberRequest.displayName || shopName);
        }
        // Detect coexistence mode: custom + has own phoneNumberId
        if (data.mode === "custom" && data.phoneNumberId) {
          setCustomSubMode("coexistence");
          setPhoneNumberId(data.phoneNumberId || "");
          setAccessToken(data.accessToken || "");
        } else if (data.mode === "custom") {
          setCustomSubMode("managed");
        }
      }
      setLoading(false);
    }
    loadConfig();
  }, [shopId]);

  useEffect(() => {
    // Listen for the session info from Meta's popup
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data.type !== 'WA_EMBEDDED_SIGNUP') return;

        // Meta emits several terminal events, not just FINISH. Previously only
        // FINISH was handled, so cancellations and errors were silent and the
        // user was left staring at a spinner.
        // https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/implementation
        const FINISH_EVENTS = [
          'FINISH',
          'FINISH_ONLY_WABA',
          'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
          'FINISH_OBO_MIGRATION',
          'FINISH_GRANT_ONLY_API_ACCESS',
        ];

        if (FINISH_EVENTS.includes(data.event)) {
          // waba_id is required server-side to subscribe webhooks. It was
          // previously discarded, which left every connection without webhooks.
          embeddedPhoneIdRef.current = data.data?.phone_number_id ?? "";
          embeddedWabaIdRef.current = data.data?.waba_id ?? "";
          embeddedBusinessIdRef.current = data.data?.business_id ?? "";
        } else if (data.event === 'CANCEL') {
          setOauthLoading(false);
          setOauthError(
            `Setup was cancelled${data.data?.current_step ? ` at: ${data.data.current_step}` : ''}.`
          );
        } else if (data.event === 'ERROR') {
          setOauthLoading(false);
          setOauthError(data.data?.error_message || 'WhatsApp signup failed.');
        }
      } catch (e) {}
    };
    window.addEventListener('message', messageListener);

    // Initialize Facebook SDK
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "27640429408950430",
        cookie: true,
        xfbml: true,
        version: "v26.0",
      });
      setFbSDKLoaded(true);
    };

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else if (window.FB) {
      setFbSDKLoaded(true);
    }

    return () => window.removeEventListener('message', messageListener);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const payload: Parameters<typeof updateShopWhatsAppConfigAction>[1] = {
      enabled,
      mode,
      statuses,
    };

    if (mode === "custom" && customSubMode === "coexistence") {
      if (!phoneNumberId || !accessToken) {
        setSaveError("Phone Number ID and Access Token are required for coexistence mode.");
        setSaving(false);
        return;
      }
      payload.phoneNumberId = phoneNumberId.trim();
      payload.accessToken = accessToken.trim();
    }

    const res = await updateShopWhatsAppConfigAction(shopId, payload);

    setSaving(false);
    if (res && !res.error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setSaveError(res?.error || "Failed to save configuration");
    }
  };

  const launchWhatsAppSignup = () => {
    if (!window.FB) return;
    setOauthLoading(true);
    setOauthError(null);

    window.FB.login((response: any) => {
      if (!response.authResponse) {
        setOauthLoading(false);
        setOauthError("Facebook login was cancelled or failed.");
        return;
      }

      // The exchangeable code has a 30-SECOND TTL, so it is sent immediately.
      // The session details (phone/waba id) arrive on a separate postMessage
      // event; blocking on that risked the code expiring before exchange.
      // The server falls back to debug_token if waba_id has not landed yet.
      const code = response.authResponse.code;

      handleWhatsAppOAuthAction(shopId, code, {
        phoneNumberId: embeddedPhoneIdRef.current,
        wabaId: embeddedWabaIdRef.current,
        businessId: embeddedBusinessIdRef.current,
      }).then(res => {
        setOauthLoading(false);
        if (res.success) {
          // Surface partial failures instead of silently reloading — the
          // connection may exist while webhooks or registration failed.
          const warnings: string[] = res.data?.warnings ?? [];
          if (warnings.length) {
            setOauthError(`Connected, but: ${warnings.join(' ')}`);
            return;
          }
          window.location.reload();
        } else {
          setOauthError(res.error || "Failed to link WhatsApp account.");
        }
      });
    }, {
      config_id: '1615068986995950',
      response_type: 'code',
      override_default_response_type: true,
      extras: { 
        sessionInfoVersion: '3',
        version: 'v3',
        featureType: 'whatsapp_business_messaging'
      },
    });
  };

  const handleRequestNumber = async () => {
    if (!requestPhone || !requestDisplayName) return;
    setRequestSubmitting(true);
    setRequestFeedback(null);

    const res = await requestDedicatedNumberAction(shopId, requestPhone, requestDisplayName);
    setRequestSubmitting(false);

    if (res.success) {
      setDedicatedRequest(res.data?.dedicatedNumberRequest || {
        phone: requestPhone,
        displayName: requestDisplayName,
        status: "submitted" as RequestStatus,
        submittedAt: new Date().toISOString(),
      });
      setRequestFeedback({ success: true, msg: res.message || "Request submitted! Our team will activate it within 24-48 hours." });
    } else {
      setRequestFeedback({ success: false, msg: `${res.error || "Failed to submit request."}` });
    }
  };

  const handleTest = async () => {
    if (!testPhone) return;
    setTestSending(true);
    setTestFeedback(null);

    const res = await testShopWhatsAppConfigAction(shopId, testPhone, shopName);
    setTestSending(false);

    if (res.success) {
      setTestFeedback({ success: true, msg: "✅ Test message delivered! Check your WhatsApp." });
    } else {
      setTestFeedback({ success: false, msg: `❌ ${res.error || "Failed to send test message."}` });
    }
  };

  const toggleStatus = (st: string) => {
    setStatuses((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  // Determine the active sender name for WhatsApp preview
  const activeSenderName = (mode === "custom" && dedicatedRequest?.status === "active")
    ? dedicatedRequest.displayName
    : (mode === "custom" && customSubMode === "coexistence" && phoneNumberId)
    ? shopName
    : "EzyWorkz";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-green-500" /> Loading WhatsApp settings...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Top Banner                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-3xl p-6 text-white shadow-xl shadow-green-600/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-200" />
            <h2 className="text-xl font-bold">Automated WhatsApp Messaging</h2>
          </div>
          <p className="text-green-100 text-sm max-w-xl">
            Automatically send branded order updates & invoice links to your customers' WhatsApp whenever their order status changes.
          </p>
        </div>

        {/* Master Toggle */}
        <label className="relative inline-flex items-center cursor-pointer bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[18px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-400"></div>
          <span className="ml-3 text-sm font-bold text-white">
            {enabled ? "Notifications Active" : "Disabled"}
          </span>
        </label>
      </div>

      {enabled && (
        <>
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* Sender Mode Selection                                         */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-5 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500" /> Choose Your WhatsApp Sender
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select how your customers see order notifications on WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ── Option A: EzyWorkz Gateway ── */}
              <div
                onClick={() => setMode("platform")}
                className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex flex-col space-y-3 ${
                  mode === "platform"
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20 shadow-md shadow-green-500/5"
                    : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:border-gray-200 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2.5 py-1 rounded-full">
                    Default · Free
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === "platform" ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                    {mode === "platform" && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">Send via EzyWorkz</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Messages sent from the <strong>EzyWorkz</strong> verified number. Your shop name & invoice link appear in the message. Zero setup.
                  </p>
                </div>
              </div>

              {/* ── Option B: Coexistence (self-service) ── */}
              <div
                onClick={() => { setMode("custom"); setCustomSubMode("coexistence"); }}
                className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex flex-col space-y-3 ${
                  mode === "custom" && customSubMode === "coexistence"
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-md shadow-blue-500/5"
                    : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:border-gray-200 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2.5 py-1 rounded-full">
                    Coexistence · Self-setup
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === "custom" && customSubMode === "coexistence" ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                    {mode === "custom" && customSubMode === "coexistence" && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">Your Own WhatsApp Number</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Connect your existing WhatsApp number via Meta Cloud API. Your phone keeps working normally — coexistence mode means both your device <em>and</em> the API can send messages.
                  </p>
                </div>
              </div>

              {/* ── Option C: Managed Dedicated Number ── */}
              <div
                onClick={() => { setMode("custom"); setCustomSubMode("managed"); }}
                className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex flex-col space-y-3 ${
                  mode === "custom" && customSubMode === "managed"
                    ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-md shadow-purple-500/5"
                    : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:border-gray-200 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2.5 py-1 rounded-full">
                    Managed · EzyWorkz handles it
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === "custom" && customSubMode === "managed" ? "border-purple-500 bg-purple-500" : "border-gray-300"}`}>
                    {mode === "custom" && customSubMode === "managed" && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">Dedicated Shop Number</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Submit your number and EzyWorkz handles 100% of the Meta setup, verification, and billing on your behalf.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Coexistence Credentials Section ── */}
            {mode === "custom" && customSubMode === "coexistence" && (
              <div className="mt-2 p-5 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800/50 space-y-5">
                <div className="flex items-start gap-3">
                  <Link2 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Connect via WhatsApp Coexistence</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      Your WhatsApp number continues to work on your phone normally. Paste your Meta Cloud API credentials below to also enable automated order messages.
                    </p>
                  </div>
                </div>

                {/* Step guide */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-100 dark:border-blue-900/40 p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" /> How to get your credentials
                  </p>
                  <ol className="text-xs text-gray-500 dark:text-gray-400 list-decimal list-inside space-y-1 leading-relaxed">
                    <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline inline-flex items-center gap-0.5">developers.facebook.com <ExternalLink className="w-3 h-3" /></a></li>
                    <li>Create a Meta App → Add the <strong>WhatsApp</strong> product</li>
                    <li>In <strong>WhatsApp → API Setup</strong>, add your phone number with <strong>Coexistence enabled</strong></li>
                    <li>Verify via OTP sent to your phone</li>
                    <li>Copy the <strong>Phone Number ID</strong> from the dashboard</li>
                    <li>Create a <strong>System User</strong> → generate a <strong>permanent token</strong> with <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">whatsapp_business_messaging</code> permission</li>
                  </ol>
                </div>

                {/* Embedded Signup Flow Button */}
                <div className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/40 rounded-xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white text-sm">Automated Connect (Recommended)</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Log in with Facebook to automatically link your WhatsApp Business account. No manual copy-pasting required.
                    </p>
                    {oauthError && <p className="text-xs text-red-500 mt-2 font-semibold">❌ {oauthError}</p>}
                  </div>
                  <button
                    onClick={launchWhatsAppSignup}
                    disabled={!fbSDKLoaded || oauthLoading}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {oauthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect with Facebook"}
                  </button>
                </div>

                {/* Credentials form */}
                <div className="grid grid-cols-1 gap-4 pt-4 border-t border-blue-200 dark:border-blue-900/40">
                  <h5 className="font-bold text-gray-700 dark:text-gray-300 text-xs">Or Enter Credentials Manually</h5>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Phone Number ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      placeholder="e.g. 123456789012345"
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Found in Meta for Developers → WhatsApp → API Setup → Phone Number ID</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" /> Permanent System User Access Token <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxx..."
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 pr-16 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {showToken ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Use a <strong>permanent</strong> system user token — not the temporary test token. Never share this.</p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Important:</strong> You are responsible for your own Meta API costs. Meta charges per conversation (~₹0.58–₹1.50 per 24-hour window). EzyWorkz does not bill you separately for coexistence mode.
                  </span>
                </div>
              </div>
            )}

            {/* ── Managed Dedicated Number Request Section ── */}
            {mode === "custom" && customSubMode === "managed" && (
              <div className="mt-2 space-y-4">
                {dedicatedRequest ? (
                  <div className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-500" /> Dedicated Number Request
                      </h4>
                      <StatusBadge status={dedicatedRequest.status} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Phone Number</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">+91 {dedicatedRequest.phone}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Display Name</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{dedicatedRequest.displayName}</p>
                      </div>
                    </div>

                    <ProgressTracker status={dedicatedRequest.status} />

                    {dedicatedRequest.status === "rejected" && dedicatedRequest.rejectionReason && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span><strong>Reason:</strong> {dedicatedRequest.rejectionReason}</span>
                      </div>
                    )}

                    {dedicatedRequest.status === "rejected" && (
                      <button
                        onClick={() => setDedicatedRequest(null)}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 underline"
                      >
                        Submit a new request →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" /> Request Dedicated WhatsApp Number
                      </h4>
                      <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full">
                        100% Free · Managed by EzyWorkz
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Submit your shop's business phone number. Our team handles 100% of the WhatsApp Business setup, Meta verification, and ongoing billing. You don't need any technical knowledge — just enter your number and we'll do the rest.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                          WhatsApp Display Name
                        </label>
                        <input
                          type="text"
                          value={requestDisplayName}
                          onChange={(e) => setRequestDisplayName(e.target.value)}
                          placeholder="e.g. The Laundry Studio"
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">This name appears at the top of the customer's WhatsApp chat.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                          Business Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700">+91</span>
                          <input
                            type="tel"
                            value={requestPhone}
                            onChange={(e) => setRequestPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="9876543210"
                            maxLength={10}
                            className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">Enter your 10-digit business mobile or landline number.</p>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                      <span>
                        <strong>What happens next?</strong> After you submit, our team will register this number under the EzyWorkz Meta Business Portfolio. You may receive a verification SMS/call from Meta. We'll update the status here once your number is live — typically within 24-48 hours.
                      </span>
                    </div>

                    <button
                      onClick={handleRequestNumber}
                      disabled={!requestPhone || requestPhone.length < 10 || !requestDisplayName || requestSubmitting}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {requestSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                      ) : (
                        <><Send className="w-4 h-4" /> Submit Request for Dedicated Number</>
                      )}
                    </button>

                    {requestFeedback && (
                      <p className={`text-xs font-semibold text-center ${requestFeedback.success ? "text-green-600" : "text-red-600"}`}>
                        {requestFeedback.msg}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* Status Triggers + WhatsApp Preview                            */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ── Status Triggers ── */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Automated Status Triggers
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select which order stages trigger automatic WhatsApp messages to the customer:
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    { id: "in_process", label: "Order Received & Processing", desc: "Triggers when order is placed or processing begins" },
                    { id: "ready_to_deliver", label: "Laundry Fresh & Ready", desc: "Triggers when clothes are processed and ready" },
                    { id: "delivered", label: "Order Delivered", desc: "Triggers upon successful handover" },
                  ].map((st) => (
                    <label
                      key={st.id}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        statuses.includes(st.id)
                          ? "border-green-200 dark:border-green-800/60 bg-green-50/40 dark:bg-green-950/10"
                          : "border-gray-100 dark:border-gray-800 bg-gray-50/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={statuses.includes(st.id)}
                        onChange={() => toggleStatus(st.id)}
                        className="mt-1 rounded text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white block">{st.label}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">{st.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Save WhatsApp Settings</>
                  )}
                </button>
                {saveSuccess && (
                  <p className="text-xs font-semibold text-green-600 text-center mt-2">✓ WhatsApp configuration saved successfully!</p>
                )}
                {saveError && (
                  <p className="text-xs font-semibold text-red-600 text-center mt-2">❌ {saveError}</p>
                )}
              </div>
            </div>

            {/* ── WhatsApp Preview ── */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-500" /> Customer WhatsApp Preview
              </h3>

              {/* WhatsApp Phone Mockup */}
              <div className="bg-[#0b141a] rounded-2xl p-4 space-y-3 font-sans border border-gray-800">
                {/* Chat Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
                  <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                    {activeSenderName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{activeSenderName}</p>
                    <p className="text-xs text-emerald-400">Official Business Account</p>
                  </div>
                </div>

                {/* Message Bubble */}
                <div className="bg-[#005c4b] text-white rounded-2xl rounded-tl-none p-3.5 text-xs leading-relaxed space-y-2 max-w-[88%] shadow-md">
                  <p className="font-bold text-emerald-200">Laundry Fresh & Ready 🧺</p>
                  <p>Dear <strong>Rahul</strong>, thank you for choosing <strong>{shopName}</strong>.</p>
                  <p>We are pleased to inform you that your order <strong>#ORD1024</strong> has been processed and your garments are fresh, clean, and ready for handover.</p>
                  <p className="text-emerald-100">
                    Access your official invoice and order details here:<br />
                    <span className="underline text-emerald-200">https://{subdomain}.ezyworkz.com/invoice/ORD1024</span>
                  </p>
                  <p>Our delivery team will be arriving shortly, or you are welcome to pick up your garments at your convenience.</p>
                  <p className="text-emerald-300 font-semibold">— {shopName} Team.</p>
                  <div className="pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[10px] text-emerald-300">
                    <span>Powered by EzyWorkz</span>
                    <span>12:45 PM ✓✓</span>
                  </div>
                </div>
              </div>

              {/* Sender indicator */}
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  mode === "custom" && customSubMode === "coexistence" && phoneNumberId
                    ? "bg-blue-500"
                    : mode === "custom" && dedicatedRequest?.status === "active"
                    ? "bg-purple-500"
                    : "bg-green-500"
                }`}></div>
                <span className="text-gray-500 dark:text-gray-400">
                  Sending as <strong className="text-gray-700 dark:text-gray-200">{activeSenderName}</strong>
                  {mode === "custom" && customSubMode === "coexistence" && !phoneNumberId && (
                    <span className="text-amber-500 ml-1">(credentials not configured — currently via EzyWorkz)</span>
                  )}
                  {mode === "custom" && customSubMode === "managed" && dedicatedRequest?.status !== "active" && (
                    <span className="text-amber-500 ml-1">(pending activation — currently via EzyWorkz)</span>
                  )}
                </span>
              </div>

              {/* Test Message Form */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Send Test Notification to Your Phone
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Enter phone (e.g. 9876543210)"
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={handleTest}
                    disabled={!testPhone || testSending}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    {testSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Test
                  </button>
                </div>
                {testFeedback && (
                  <p className={`text-xs font-semibold ${testFeedback.success ? "text-green-600" : "text-red-600"}`}>
                    {testFeedback.msg}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* Sub-components                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, { label: string; color: string }> = {
    submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    under_review: { label: "Under Review", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
    verified: { label: "Verified", color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
    active: { label: "Active & Live", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
    rejected: { label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  };
  const { label, color } = map[status] || map.submitted;
  return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${color}`}>{label}</span>;
}

function ProgressTracker({ status }: { status: RequestStatus }) {
  const steps: { key: RequestStatus; label: string }[] = [
    { key: "submitted", label: "Submitted" },
    { key: "under_review", label: "Under Review" },
    { key: "verified", label: "Verified" },
    { key: "active", label: "Active" },
  ];

  const order: RequestStatus[] = ["submitted", "under_review", "verified", "active"];
  const currentIdx = order.indexOf(status);
  const isRejected = status === "rejected";

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const isCompleted = !isRejected && currentIdx >= i;
        const isCurrent = !isRejected && currentIdx === i;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isRejected && i === 0
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400"
              } ${isCurrent ? "ring-2 ring-green-300 ring-offset-2 dark:ring-offset-gray-900" : ""}`}>
                {isCompleted ? (
                  <CircleCheck className="w-4 h-4" />
                ) : (
                  <CircleDot className="w-4 h-4" />
                )}
              </div>
              <span className={`text-[10px] font-semibold text-center leading-tight ${
                isCompleted ? "text-green-600 dark:text-green-400" : "text-gray-400"
              }`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mt-[-16px] rounded-full ${
                !isRejected && currentIdx > i ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
