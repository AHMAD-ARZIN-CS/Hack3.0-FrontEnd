import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingList } from "@/components/ui/States";
import { ResourceExplorer } from "./ResourceExplorer";

export const metadata: Metadata = { title: "Resources" };

export default function ResourcesPage() {
  return (
    <>
      <PageHeader title="Campus Resources" subtitle="Help that already exists, on campus and nearby." back={{ href: "/discover", label: "Discover" }} />
      <Suspense fallback={<LoadingList />}>
        <ResourceExplorer />
      </Suspense>
    </>
  );
}
