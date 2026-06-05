"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface Feedback {
  feedbackId: string;
  source?: "user" | "shop";
  shopId?: string;
  userName?: string;
  phoneNumber?: string;
  rating: number;
  category: string;
  comments: string;
  deviceInfo?: string;
  createdAt: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
}

interface FeedbackTableProps {
  feedback: Feedback[];
}

export default function FeedbackTable({ feedback }: FeedbackTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Source
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  User / Shop
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Rating
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Category
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Comments
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Created At
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {feedback.map((item) => (
                <TableRow key={item.feedbackId}>
                  {/* Source badge */}
                  <TableCell className="px-5 py-4 text-start">
                    <Badge size="sm" color={item.source === "shop" ? "warning" : "info"}>
                      {item.source === "shop" ? "🏪 Shop" : "👤 User"}
                    </Badge>
                  </TableCell>

                  {/* User / Shop name */}
                  <TableCell className="px-5 py-4 text-start">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {item.userName || "Guest"}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {item.source === "shop" && item.shopId
                          ? `Shop ID: ${item.shopId}`
                          : item.phoneNumber || "No Phone"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Rating */}
                  <TableCell className="px-4 py-3 text-start">
                    <Badge
                      size="sm"
                      color={item.rating >= 4 ? "success" : item.rating >= 3 ? "warning" : "error"}
                    >
                      {item.rating} / 5
                    </Badge>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {item.category}
                  </TableCell>

                  {/* Comments */}
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {item.comments}
                  </TableCell>

                  {/* Date — fixed locale to avoid hydration mismatch */}
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {formatDate(item.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
