import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingList } from "@/components/ui/States";
import { NewResourceForm } from "./NewResourceForm";

export const metadata: Metadata = { title: "Share a resource" };

export default function NewResourcePage() {
  return (
    <Suspense fallback={<LoadingList />}>
      <NewResourceForm />
    </Suspense>
  );
}
