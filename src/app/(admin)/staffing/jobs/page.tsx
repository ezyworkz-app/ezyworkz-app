import JobsClient from "@/components/staffing/JobsClient";
import { getAllHiringRequests } from "@/lib/actions/staffing";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const { hiringRequests, count } = await getAllHiringRequests();

  return (
    <div className="space-y-6">
      <JobsClient 
        initialJobs={hiringRequests} 
        initialCount={count} 
      />
    </div>
  );
}
