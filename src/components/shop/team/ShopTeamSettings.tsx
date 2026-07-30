"use client";

import React, { useState, useEffect } from "react";
import {
  getShopManagersAction,
  createShopManagerAction,
  deleteShopManagerAction,
  ManagerMember,
} from "@/lib/actions/managers";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Wrench,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";

interface Props {
  shopId: string;
  shopName: string;
}

export default function ShopTeamSettings({ shopId, shopName }: Props) {
  const [managers, setManagers] = useState<ManagerMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"manager" | "staff">("manager");
  const [showPassword, setShowPassword] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchManagers = async () => {
    setLoading(true);
    const data = await getShopManagersAction(shopId);
    setManagers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchManagers();
  }, [shopId]);

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const res = await createShopManagerAction(shopId, {
      name,
      email,
      password,
      phone: phone || undefined,
      role,
    });

    setSubmitting(false);

    if (res.success) {
      setSuccessMsg(`✓ ${role === "staff" ? "Staff member" : "Manager"} ${name} added successfully!`);
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("manager");
      setShowAddModal(false);
      fetchManagers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setError(res.error || "Failed to add team member.");
    }
  };

  const handleDeleteManager = async (managerId: string, managerName: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${managerName}?`)) return;

    setDeletingId(managerId);
    const res = await deleteShopManagerAction(shopId, managerId);
    setDeletingId(null);

    if (res.success) {
      setSuccessMsg(`✓ ${managerName} removed from team.`);
      fetchManagers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      alert(res.error || "Failed to remove team member");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-purple-600" /> Loading team members...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-purple-600/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-200" />
            <h2 className="text-xl font-bold">Shop Team & Roles</h2>
          </div>
          <p className="text-purple-100 text-sm max-w-xl">
            Assign store managers and staff members to help operate {shopName}. Control permissions and operational access.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white text-purple-700 hover:bg-purple-50 font-bold px-4 py-2.5 rounded-2xl transition-all text-sm flex items-center gap-2 shadow-md shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Role Access Matrix Guide - 3 Roles */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-500" /> 3 Shop Access Roles & Privileges
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Owner */}
          <div className="p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 dark:text-purple-200 text-sm flex items-center gap-1.5">
                👑 Owner
              </span>
              <span className="text-[10px] uppercase font-bold bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full">
                Full Admin
              </span>
            </div>
            <ul className="text-xs text-purple-800 dark:text-purple-300 space-y-1 list-disc list-inside">
              <li>Manage subscriptions & billing</li>
              <li>Add/remove Managers & Staff</li>
              <li>Configure custom WhatsApp numbers</li>
              <li>Full access to store analytics</li>
            </ul>
          </div>

          {/* Card 2: Manager */}
          <div className="p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 dark:text-blue-200 text-sm flex items-center gap-1.5">
                👔 Manager
              </span>
              <span className="text-[10px] uppercase font-bold bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                Operations
              </span>
            </div>
            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Create & update customer orders</li>
              <li>Manage customer lists & complaints</li>
              <li>Send WhatsApp test messages</li>
              <li>View daily store performance</li>
            </ul>
          </div>

          {/* Card 3: Staff */}
          <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-1.5">
                🧑‍🔧 Staff
              </span>
              <span className="text-[10px] uppercase font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                Order Processing
              </span>
            </div>
            <ul className="text-xs text-emerald-800 dark:text-emerald-300 space-y-1 list-disc list-inside">
              <li>View assigned laundry orders</li>
              <li>Update item statuses (Washing, Ready)</li>
              <li>Handle clothes pickup/handover</li>
              <li>No access to revenue/billing settings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Active Team Members List */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-500" /> Assigned Team Members ({managers.length})
          </h3>
        </div>

        {managers.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              No team members assigned yet.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              + Click here to add a manager or staff member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {managers.map((m) => {
              const isStaff = m.role === "staff" || m.role === "member";

              return (
                <div
                  key={m.managerId}
                  className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-800/40 space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center text-sm shadow-md ${isStaff ? "bg-emerald-600" : "bg-purple-600"}`}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{m.name}</h4>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isStaff
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                        }`}>
                          {isStaff ? "Staff Member" : "Manager"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteManager(m.managerId, m.name)}
                      disabled={deletingId === m.managerId}
                      className="text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-40"
                      title="Revoke Access"
                    >
                      {deletingId === m.managerId ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{m.email}</span>
                    </div>
                    {m.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{m.phone}</span>
                      </div>
                    )}
                    {m.joinedAt && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Joined {new Date(m.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Add Team Member Modal                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                <UserPlus className="w-5 h-5 text-purple-600" /> Add Team Member
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs font-semibold rounded-xl">
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleCreateManager} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("manager")}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      role === "manager"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 ring-2 ring-purple-500/20"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40"
                    }`}
                  >
                    <span className="font-bold text-xs text-gray-900 dark:text-white">👔 Manager</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Full store operations</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("staff")}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      role === "staff"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40"
                    }`}
                  >
                    <span className="font-bold text-xs text-gray-900 dark:text-white">🧑‍🔧 Staff</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Order processing only</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arun Kumar"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arun@thelaundrystudio.com"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Login Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set member login password"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...</>
                  ) : (
                    <><UserPlus className="w-3.5 h-3.5" /> Assign Member</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
