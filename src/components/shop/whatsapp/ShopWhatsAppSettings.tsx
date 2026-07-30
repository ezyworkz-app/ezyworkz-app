"use client";

import React, { useState, useEffect } from "react";
import {
  getShopWhatsAppConfigAction,
  updateShopWhatsAppConfigAction,
  testShopWhatsAppConfigAction,
  requestDedicatedNumberAction,
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
} from "lucide-react";

interface Props {
  shopId: string;
  shopName?: string;
  subdomain?: string;
}

type RequestStatus = "submitted" | "under_review" | "verified" | "active" | "rejected";

export default function ShopWhatsAppSettings({ shopId, shopName = "Your Laundry Studio", subdomain = "thelaundrystudio" }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<"platform" | "custom">("platform");
  const [statuses, setStatuses] = useState<string[]>(["in_process", "ready_to_deliver", "delivered"]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      }
      setLoading(false);
    }
    loadConfig();
  }, [shopId]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const res = await updateShopWhatsAppConfigAction(shopId, {
      enabled,
      mode,
      statuses,
    });

    setSaving(false);
    if (res && !res.error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setSaveError(res?.error || "Failed to save configuration");
    }
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Default · Instant
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === "platform" ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                    {mode === "platform" && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">Send via EzyWorkz</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Messages are sent from the <strong>EzyWorkz</strong> verified WhatsApp number. The message body still features <strong>{shopName}</strong>, your invoice link, and shop branding. Zero setup required.
                  </p>
                </div>
              </div>

              {/* ── Option B: Dedicated Shop Number ── */}
              <div
                onClick={() => setMode("custom")}
                className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex flex-col space-y-3 ${
                  mode === "custom"
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20 shadow-md shadow-green-500/5"
                    : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 hover:border-gray-200 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2.5 py-1 rounded-full">
                    Your Own Brand
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mode === "custom" ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                    {mode === "custom" && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-base">Send via Your Shop Name</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Messages are sent from your shop's own dedicated WhatsApp number. Customers see <strong>"{shopName}"</strong> at the top of the chat. Submit your phone number below and we handle all Meta setup and billing.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Dedicated Number Request Section ── */}
            {mode === "custom" && (
              <div className="mt-2 space-y-4">
                {/* Already has an active/submitted request */}
                {dedicatedRequest ? (
                  <div className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-500" /> Dedicated Number Request
                      </h4>
                      <StatusBadge status={dedicatedRequest.status} />
                    </div>

                    {/* Request Details */}
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

                    {/* Progress Tracker */}
                    <ProgressTracker status={dedicatedRequest.status} />

                    {/* Rejection reason */}
                    {dedicatedRequest.status === "rejected" && dedicatedRequest.rejectionReason && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span><strong>Reason:</strong> {dedicatedRequest.rejectionReason}</span>
                      </div>
                    )}

                    {/* Allow resubmission if rejected */}
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
                  /* New request form */
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
                  <p className="font-bold text-emerald-200">Order Received</p>
                  <p>Dear <strong>Rahul</strong>, thank you for choosing <strong>{shopName}</strong>.</p>
                  <p>We are pleased to confirm that your order <strong>#ORD1024</strong> has been received and is currently being processed by our specialist team.</p>
                  <p className="text-emerald-100">
                    You may monitor your order status and access your official invoice here:<br />
                    <span className="underline text-emerald-200">https://{subdomain}.ezyworkz.com/invoice/ORD1024</span>
                  </p>
                  <p>We will notify you as soon as your garments are fresh and ready.</p>
                  <p className="text-emerald-300 font-semibold">— The {shopName} Team.</p>
                  <div className="pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[10px] text-emerald-300">
                    <span>Powered by EzyWorkz</span>
                    <span>12:45 PM ✓✓</span>
                  </div>
                </div>
              </div>

              {/* Sender indicator */}
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${mode === "custom" && dedicatedRequest?.status === "active" ? "bg-purple-500" : "bg-green-500"}`}></div>
                <span className="text-gray-500 dark:text-gray-400">
                  Sending as <strong className="text-gray-700 dark:text-gray-200">{activeSenderName}</strong>
                  {mode === "custom" && dedicatedRequest?.status !== "active" && (
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
