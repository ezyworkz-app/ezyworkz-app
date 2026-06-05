"use client";
import React from "react";
import { Campaign } from "@/lib/actions/campaigns";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { format, parseISO } from "date-fns";
import { Send, MousePointerClick, Tag, Users, AlertCircle } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
    ALL: "All Users",
    FIRST_TIME: "Never Ordered",
    INACTIVE_ONE_TIME: "One-Time Dormant",
    INACTIVE_FREQUENT: "Frequent Dormant",
};

function rate(num: number, denom: number) {
    if (!denom) return "—";
    return `${((num / denom) * 100).toFixed(1)}%`;
}

function FunnelBar({ tapped, redeemed, sent }: { tapped: number; redeemed: number; sent: number }) {
    const tapPct = sent > 0 ? (tapped / sent) * 100 : 0;
    const redPct = sent > 0 ? (redeemed / sent) * 100 : 0;
    return (
        <div className="w-full space-y-1">
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${Math.min(tapPct, 100)}%` }} />
                </div>
                <span className="text-[10px] font-bold text-brand-500 w-10 text-right">{rate(tapped, sent)}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(redPct, 100)}%` }} />
                </div>
                <span className="text-[10px] font-bold text-emerald-500 w-10 text-right">{rate(redeemed, sent)}</span>
            </div>
        </div>
    );
}

interface Props {
    campaigns: Campaign[];
}

const CampaignTable: React.FC<Props> = ({ campaigns }) => {
    if (campaigns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AlertCircle className="w-10 h-10 text-gray-300" />
                <p className="text-sm font-bold text-gray-400">No campaigns launched yet.</p>
                <p className="text-xs text-gray-400">Use the Launch Campaign button to send your first conversion push.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell isHeader className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Campaign</TableCell>
                        <TableCell isHeader className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Coupon</TableCell>
                        <TableCell isHeader className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Segment</TableCell>
                        <TableCell isHeader className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <div className="flex items-center gap-1"><Send size={10} /> Sent</div>
                        </TableCell>
                        <TableCell isHeader className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <div className="flex items-center gap-1"><MousePointerClick size={10} /> Tapped</div>
                        </TableCell>
                        <TableCell isHeader className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <div className="flex items-center gap-1"><Tag size={10} /> Redeemed</div>
                        </TableCell>
                        <TableCell isHeader className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Funnel</TableCell>
                        <TableCell isHeader className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {campaigns.map((c) => {
                        const tapRate = rate(c.tappedCount, c.tokensSent);
                        const convRate = rate(c.redeemedCount, c.tokensSent);

                        return (
                            <TableRow key={c.campaignId} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                {/* Campaign date + offer */}
                                <TableCell className="px-6 py-4">
                                    <div>
                                        <p className="text-sm font-black text-gray-900 dark:text-white">
                                            {c.discountType === "FIXED" ? `₹${c.discountValue} OFF` : `${c.discountValue}% OFF`}
                                            {c.minOrderValue ? ` · min ₹${c.minOrderValue}` : ""}
                                        </p>
                                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                                            {format(parseISO(c.sentAt), "dd MMM yyyy, hh:mm a")}
                                        </p>
                                        <p className="text-[10px] text-gray-300 dark:text-gray-600">
                                            Expires {format(parseISO(c.expiresAt), "dd MMM")} · {c.validDays}d valid
                                        </p>
                                    </div>
                                </TableCell>

                                {/* Coupon code */}
                                <TableCell className="px-4 py-4">
                                    <span className="font-mono font-black text-brand-600 dark:text-brand-400 text-sm bg-brand-50 dark:bg-brand-500/10 px-2 py-1 rounded-lg">
                                        {c.couponCode}
                                    </span>
                                </TableCell>

                                {/* Segment */}
                                <TableCell className="px-4 py-4">
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                        {SEGMENT_LABELS[c.segment] ?? c.segment}
                                    </span>
                                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                        <Users size={9} /> {c.usersTargeted.toLocaleString()} targeted
                                    </p>
                                </TableCell>

                                {/* Sent */}
                                <TableCell className="px-4 py-4">
                                    <p className="text-sm font-black text-gray-800 dark:text-gray-100">{c.tokensSent.toLocaleString()}</p>
                                    {c.skippedNoToken > 0 && (
                                        <p className="text-[10px] text-amber-500 font-medium">{c.skippedNoToken} no token</p>
                                    )}
                                    {c.failedCount > 0 && (
                                        <p className="text-[10px] text-red-500 font-medium">{c.failedCount} failed</p>
                                    )}
                                </TableCell>

                                {/* Tapped */}
                                <TableCell className="px-4 py-4">
                                    <p className="text-sm font-black text-brand-600 dark:text-brand-400">{c.tappedCount.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-400">{tapRate} tap rate</p>
                                </TableCell>

                                {/* Redeemed */}
                                <TableCell className="px-4 py-4">
                                    <p className="text-sm font-black text-emerald-600">{c.redeemedCount.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-400">{convRate} conversion</p>
                                </TableCell>

                                {/* Funnel bars */}
                                <TableCell className="px-4 py-4 min-w-[130px]">
                                    <div className="space-y-1 mb-1">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex gap-2">
                                            <span className="text-brand-500">— tap</span>
                                            <span className="text-emerald-500">— redeem</span>
                                        </p>
                                    </div>
                                    <FunnelBar tapped={c.tappedCount} redeemed={c.redeemedCount} sent={c.tokensSent} />
                                </TableCell>

                                {/* Status */}
                                <TableCell className="px-4 py-4">
                                    <Badge color={c.status === "active" ? "success" : "warning"}>
                                        {c.status === "active" ? "Active" : "Expired"}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default CampaignTable;
