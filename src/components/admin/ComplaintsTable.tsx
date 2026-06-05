"use client";
import React from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface Complaint {
  complaintId: string;
  orderId: string;
  userName?: string;
  shopName?: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
}

interface ComplaintsTableProps {
  complaints: Complaint[];
}

export default function ComplaintsTable({ complaints }: ComplaintsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  ID & Subject
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Parties
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Category
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Created At
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {complaints.map((item) => (
                <TableRow key={item.complaintId}>
                  <TableCell className="px-5 py-4 text-start">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {item.subject}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {item.complaintId.slice(0, 8)} | Order: {item.orderId.slice(-6).toUpperCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        User: {item.userName || "Guest"}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        Shop: {item.shopName || "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <span className="capitalize">{item.category.replace('_', ' ')}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <Badge
                      size="sm"
                      color={
                        item.status === "open" ? "error" :
                        item.status === "in_review" ? "warning" :
                        "success"
                      }
                    >
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {format(new Date(item.createdAt), "dd MMM yyyy, HH:mm")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <Link
                      href={`/complaints/${item.complaintId}`}
                      className="text-brand-500 hover:text-brand-600 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              
              {complaints.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-8 text-center text-gray-500">
                    No complaints found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
