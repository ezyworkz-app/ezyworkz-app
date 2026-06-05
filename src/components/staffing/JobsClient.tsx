"use client";

import React, { useState } from "react";
import { Briefcase, RefreshCw, CheckCircle, XCircle, Play } from "lucide-react";
import { updateHiringRequestStatus, matchWorkersToJob } from "@/lib/actions/staffing";
import { HiringRequest, HiringRequestStatus } from "@/types/staffing";
import Card from "../ui/Card";
import Select from "../ui/Select";
import Button from "../ui/Button";
import JobsTable from "./JobsTable";
import { X } from "lucide-react";

interface JobsClientProps {
  initialJobs: HiringRequest[];
  initialCount: number;
}

const TabButton = ({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: any;
}) => (
  <button
    onClick={onClick}
    className={`shrink-0 py-3 px-4 text-xs font-bold transition-all duration-200 flex items-center gap-2 relative whitespace-nowrap ${active
      ? "text-brand-500"
      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      }`}
  >
    <Icon className={`h-3.5 w-3.5 ${active ? "text-brand-500" : "text-gray-400 opacity-70"}`} />
    {label}
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
    )}
  </button>
);

const JobsClient: React.FC<JobsClientProps> = ({ 
  initialJobs, 
  initialCount 
}) => {
  const [jobs, setJobs] = useState<HiringRequest[]>(initialJobs);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<HiringRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    status: "" as HiringRequestStatus,
  });

  const statusOptions = [
    { id: "all", label: "All Jobs", icon: Briefcase },
    { id: "open", label: "Open", icon: Play },
    { id: "filled", label: "Filled", icon: CheckCircle },
    { id: "closed", label: "Closed", icon: XCircle },
  ];

  const filteredJobs = selectedStatus === "all" 
    ? jobs 
    : jobs.filter(j => j.status === selectedStatus);

  const openModal = (job: HiringRequest) => {
    setSelectedJob(job);
    setFormState({ status: job.status });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    
    setIsLoading(true);
    const result = await updateHiringRequestStatus(selectedJob.hiringRequestId, formState.status);
    
    if (result.success) {
      setJobs(prev => prev.map(j => 
        j.hiringRequestId === selectedJob.hiringRequestId 
          ? { ...j, status: formState.status } 
          : j
      ));
      closeModal();
    } else {
      alert(result.error || "Failed to update status");
    }
    setIsLoading(false);
  };

  const handleManualMatch = async (job: HiringRequest) => {
    if (!confirm(`Trigger matching algorithm for ${job.shopName}?`)) return;
    
    setIsLoading(true);
    const result = await matchWorkersToJob(job.hiringRequestId);
    
    if (result.success) {
      alert(`Successfully matched ${result.matchedCount} workers!`);
      // Update local matched count if needed (though backend handles it)
    } else {
      alert(result.error || "Failed to match workers");
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Job Requests</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-0.5">Shop Hiring Pipeline Management</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-white dark:bg-gray-900 px-6 py-2 rounded-3xl border border-gray-200 dark:border-gray-800">
        <div className="flex space-x-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar pb-1">
          {statusOptions.map((opt) => (
            <TabButton
              key={opt.id}
              active={selectedStatus === opt.id}
              onClick={() => setSelectedStatus(opt.id)}
              label={opt.label}
              icon={opt.icon}
            />
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <Card padding="none" className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-3xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/10">
          <div className="flex flex-col">
            <h2 className="text-theme-sm font-black text-gray-900 dark:text-white tracking-tight">
              {statusOptions.find(o => o.id === selectedStatus)?.label} Pipeline
            </h2>
            <p className="text-theme-xs text-gray-400 mt-0.5 lowercase font-medium">monitor and match hiring requests</p>
          </div>
          {isLoading && <RefreshCw className="animate-spin text-brand-500" size={18} />}
        </div>
        <JobsTable
          jobs={filteredJobs}
          onEdit={openModal}
          onMatch={handleManualMatch}
        />
      </Card>

      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500/60 transition-opacity" onClick={closeModal} />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg leading-6 font-bold text-gray-900">Edit Hiring Request Status</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleStatusUpdate} className="space-y-4">
                  <Select
                    label="Status"
                    options={[
                      { value: "open", label: "Open" },
                      { value: "filled", label: "Filled" },
                      { value: "cancelled", label: "Cancelled" },
                      { value: "closed", label: "Closed" },
                    ]}
                    value={formState.status}
                    onChange={(val) => setFormState(s => ({ ...s, status: val as HiringRequestStatus }))}
                  />

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                    <Button type="button" variant="outline" onClick={closeModal} className="w-full">Cancel</Button>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsClient;
