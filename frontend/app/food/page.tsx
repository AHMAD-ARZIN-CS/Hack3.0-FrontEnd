import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingList } from "@/components/ui/States";
import { FoodHub } from "./FoodHub";

export const metadata: Metadata = { title: "Food" };

export default function FoodPage() {
  return (
    <Suspense fallback={<LoadingList />}>
      <FoodHub />
    </Suspense>
  );
}
