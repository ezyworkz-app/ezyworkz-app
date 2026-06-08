import WorkersClient from "@/components/staffing/WorkersClient";
import { getAllWorkers } from "@/lib/actions/staffing";

export const dynamic = "force-dynamic";

export default async function WorkersPage() {
  const { workers, count } = await getAllWorkers();

  return (
    <div className="space-y-6">
      <WorkersClient 
        initialWorkers={workers} 
        initialCount={count} 
      />
    </div>
  );
}
