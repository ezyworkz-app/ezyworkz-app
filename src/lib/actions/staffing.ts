"use server";

import { cookies } from "next/headers";
import { apiFetch } from "../api";
import { revalidatePath } from "next/cache";
import { Worker, HiringRequest, WorkerStatus, HiringRequestStatus } from "@/types/staffing";

/**
 * Get all verified and pending workers
 */
export async function getAllWorkers(limit: number = 50): Promise<{ workers: Worker[]; count: number }> {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/staffing/workers/all?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch workers");
    }

    return {
      workers: (data.data.workers || []) as Worker[],
      count: data.data.count || 0,
    };
  } catch (error) {
    console.error("[getAllWorkers]", error);
    return { workers: [], count: 0 };
  }
}

/**
 * Update worker status (verify/reject)
 */
export async function updateWorkerStatus(workerId: string, status: WorkerStatus, verificationNotes?: string) {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/staffing/workers/${workerId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, verificationNotes }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update worker status");
    }

    revalidatePath("/staffing/workers");
    return { success: true, message: data.message };
  } catch (error: any) {
    console.error("[updateWorkerStatus]", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all open hiring requests
 */
export async function getAllHiringRequests(limit: number = 50): Promise<{ hiringRequests: HiringRequest[]; count: number }> {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/staffing/jobs?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch hiring requests");
    }

    return {
      hiringRequests: (data.data.hiringRequests || []) as HiringRequest[],
      count: data.data.count || 0,
    };
  } catch (error) {
    console.error("[getAllHiringRequests]", error);
    return { hiringRequests: [], count: 0 };
  }
}

/**
 * Update hiring request status
 */
export async function updateHiringRequestStatus(hiringRequestId: string, status: HiringRequestStatus) {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/staffing/jobs/${hiringRequestId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to update hiring request status");
    }

    revalidatePath("/staffing/jobs");
    return { success: true, message: data.message };
  } catch (error: any) {
    console.error("[updateHiringRequestStatus]", error);
    return { success: false, error: error.message };
  }
}

/**
 * Trigger matching for a hiring request
 */
export async function matchWorkersToJob(hiringRequestId: string) {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) throw new Error("Not authenticated");

    const res = await apiFetch(`/api/v1/staffing/jobs/${hiringRequestId}/match`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to match workers");
    }

    revalidatePath("/staffing/jobs");
    return { success: true, message: data.message, matchedCount: data.data.matchedCount };
  } catch (error: any) {
    console.error("[matchWorkersToJob]", error);
    return { success: false, error: error.message };
  }
}
