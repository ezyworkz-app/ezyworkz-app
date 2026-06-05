export type WorkerStatus = "pending" | "verified" | "rejected" | "inactive";

export interface Worker {
  workerId: string;
  fullName: string;
  phoneNumber: string;
  experience: "0" | "1-2" | "3-5" | "5+";
  skills: string[];
  status: WorkerStatus;
  verificationNotes?: string;
  matchedJobs?: string[];
  createdAt: string;
  updatedAt: string;
}

export type HiringRequestStatus = "open" | "filled" | "cancelled" | "closed";

export interface HiringRequest {
  hiringRequestId: string;
  shopId: string;
  shopName: string;
  jobRole: "All Rounder" | "Ironing Master" | "Washing Expert" | "Delivery Partner" | "Manager";
  salaryBudget: number;
  urgency: "Immediate" | "Within 1 week" | "Flexible";
  location: string;
  status: HiringRequestStatus;
  matchedWorkers?: string[];
  createdAt: string;
  updatedAt: string;
}
