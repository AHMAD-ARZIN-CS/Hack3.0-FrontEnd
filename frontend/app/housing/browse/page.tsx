import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingList } from "@/components/ui/States";
import { HousingBrowse } from "./HousingBrowse";

export const metadata: Metadata = { title: "Browse housing" };

export default function HousingBrowsePage() {
  return (
    <Suspense fallback={<LoadingList />}>
      <HousingBrowse />
    </Suspense>
  );
}
