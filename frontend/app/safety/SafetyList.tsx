"use client";

import { ResourceCard } from "@/components/cards/ResourceCard";
import { ErrorState, LoadingList } from "@/components/ui/States";
import { useCampus } from "@/context/CampusContext";
import { useAsync } from "@/hooks/useAsync";
import { getResources } from "@/services/resources";

export function SafetyList() {
  const { currentCampus } = useCampus();
  const { data, loading, error, reload } = useAsync(
    () => getResources({ campusId: currentCampus.id, need: "safety", pageSize: 50 }),
    [currentCampus.id],
  );
  if (loading) return <LoadingList label="Loading safety resources" />;
  if (error != null || !data) return <ErrorState onRetry={reload} />;
  return (
    <div className="space-y-3">
      {data.items.map((r) => (
        <ResourceCard key={r.id} resource={r} />
      ))}
    </div>
  );
}
