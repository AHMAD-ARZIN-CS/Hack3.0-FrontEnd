import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingList } from "@/components/ui/States";
import { CommunityFeed } from "./CommunityFeed";

export const metadata: Metadata = { title: "Community" };

export default function CommunityPage() {
  return (
    <Suspense fallback={<LoadingList />}>
      <CommunityFeed />
    </Suspense>
  );
}
