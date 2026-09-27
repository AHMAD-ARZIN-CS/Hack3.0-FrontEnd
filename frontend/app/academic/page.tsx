import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingList } from "@/components/ui/States";
import { AcademicHome } from "./AcademicHome";

export const metadata: Metadata = { title: "Study help" };

export default function AcademicPage() {
  return (
    <Suspense fallback={<LoadingList />}>
      <AcademicHome />
    </Suspense>
  );
}
