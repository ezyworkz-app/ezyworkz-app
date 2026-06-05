import React, { useState } from "react";
import { Edit, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { Worker } from "@/types/staffing";

export interface WorkersTableProps {
  workers: Worker[];
  onEdit: (worker: Worker) => void;
}

const WorkersTable: React.FC<WorkersTableProps> = ({ workers, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const formatDate = (ts?: string) =>
    ts
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(new Date(ts))
      : "N/A";

  const filtered = workers.filter((w) => {
    const q = searchTerm.toLowerCase();
    return (
      w.fullName.toLowerCase().includes(q) ||
      w.phoneNumber.toLowerCase().includes(q) ||
      w.workerId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="overflow-hidden shadow ring-1 ring-gray-200 ring-opacity-5 rounded-lg">
      <div className="p-4 bg-white">
        <Input
          placeholder="Search workers…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="max-w-md"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="border-b border-gray-100 dark:border-white/[0.05]">
            <tr>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400 sm:pl-6">
                Worker Name / ID
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Skills
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Experience
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Contact
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Status
              </th>
              <th className="relative py-3 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.length ? (
              filtered.map((worker) => (
                <tr key={worker.workerId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="whitespace-nowrap pl-6 pr-4 py-5 text-start">
                    <div className="font-medium text-gray-900 text-theme-sm leading-none">{worker.fullName}</div>
                    <div className="text-[10px] text-gray-400 font-medium mt-1.5">{worker.workerId}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-wrap gap-1">
                      {worker.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-bold rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-5 text-theme-sm text-gray-800 text-start font-medium">
                    {worker.experience} Years
                  </td>
                  <td className="px-4 py-5 text-theme-sm text-gray-800 text-start font-medium">
                    {worker.phoneNumber}
                  </td>
                  <td className="px-4 py-5">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold border capitalize ${
                        worker.status === "verified"
                          ? "bg-success-50 text-success-700 border-success-100"
                          : worker.status === "pending"
                          ? "bg-warning-50 text-warning-700 border-warning-100"
                          : worker.status === "rejected"
                          ? "bg-error-50 text-error-700 border-error-100"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {worker.status}
                    </span>
                  </td>
                  <td className="py-5 pl-3 pr-6 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(worker)}
                        className="text-brand-500 hover:bg-brand-50 h-9 px-4 rounded-xl border border-transparent hover:border-brand-100"
                        leftIcon={<Edit className="h-4 w-4" />}
                      >
                        <span className="text-theme-xs font-bold">Review</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                  No workers found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkersTable;
