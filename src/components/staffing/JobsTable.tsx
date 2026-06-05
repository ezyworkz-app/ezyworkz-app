import React, { useState } from "react";
import { Edit, Search, Play } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { HiringRequest } from "@/types/staffing";

export interface JobsTableProps {
  jobs: HiringRequest[];
  onEdit: (job: HiringRequest) => void;
  onMatch: (job: HiringRequest) => void;
}

const JobsTable: React.FC<JobsTableProps> = ({ jobs, onEdit, onMatch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = jobs.filter((j) => {
    const q = searchTerm.toLowerCase();
    return (
      j.shopName.toLowerCase().includes(q) ||
      j.jobRole.toLowerCase().includes(q) ||
      j.hiringRequestId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="overflow-hidden shadow ring-1 ring-gray-200 ring-opacity-5 rounded-lg">
      <div className="p-4 bg-white">
        <Input
          placeholder="Search jobs…"
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
                Shop / ID
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Job Role
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Budget & Urgency
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Location
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Status
              </th>
              <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                Matches
              </th>
              <th className="relative py-3 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.length ? (
              filtered.map((job) => (
                <tr key={job.hiringRequestId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="whitespace-nowrap pl-6 pr-4 py-5 text-start">
                    <div className="font-medium text-gray-900 text-theme-sm leading-none">{job.shopName}</div>
                    <div className="text-[10px] text-gray-400 font-medium mt-1.5">{job.hiringRequestId}</div>
                  </td>
                  <td className="px-4 py-5">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-100">
                      {job.jobRole}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-theme-sm text-gray-800 text-start font-medium">
                    <div className="flex flex-col gap-1">
                      <span>₹{job.salaryBudget}</span>
                      <span className="text-[10px] text-gray-400 font-normal">{job.urgency}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-theme-sm text-gray-800 text-start font-medium underline">
                    {job.location}
                  </td>
                  <td className="px-4 py-5">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold border capitalize ${
                        job.status === "open"
                          ? "bg-success-50 text-success-700 border-success-100"
                          : job.status === "filled"
                          ? "bg-brand-50 text-brand-700 border-brand-100"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-gray-100 text-gray-800">
                      {job.matchedWorkers?.length || 0}
                    </span>
                  </td>
                  <td className="py-5 pl-3 pr-6 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMatch(job)}
                        className="text-success-600 hover:bg-success-50 h-9 px-4 rounded-xl border border-transparent hover:border-success-100"
                        leftIcon={<Play className="h-4 w-4" />}
                      >
                        <span className="text-theme-xs font-bold">Match</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(job)}
                        className="text-brand-500 hover:bg-brand-50 h-9 px-4 rounded-xl border border-transparent hover:border-brand-100"
                        leftIcon={<Edit className="h-4 w-4" />}
                      >
                        <span className="text-theme-xs font-bold">Edit</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                  No jobs found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobsTable;
