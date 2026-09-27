import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingList } from "@/components/ui/States";
import { MarketplaceBrowse } from "./MarketplaceBrowse";

export const metadata: Metadata = { title: "Marketplace" };

/** Discover subsection (D31). Not a tab, not on Home. */
export default function MarketplacePage() {
  return (
    <Suspense fallback={<LoadingList />}>
      <MarketplaceBrowse />
    </Suspense>
  );
}
