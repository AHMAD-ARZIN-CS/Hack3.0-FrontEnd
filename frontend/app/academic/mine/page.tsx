import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingList } from "@/components/ui/States";
import { MySubmissions } from "./MySubmissions";

export const metadata: Metadata = { title: "My submissions" };

export default function MySubmissionsPage() {
  return (
    <Suspense fallback={<LoadingList />}>
      <MySubmissions />
    </Suspense>
  );
}
