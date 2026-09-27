import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingList } from "@/components/ui/States";
import { NewHousingForm } from "./NewHousingForm";

export const metadata: Metadata = { title: "Post housing" };

export default function NewHousingPage() {
  return (
    <Suspense fallback={<LoadingList />}>
      <NewHousingForm />
    </Suspense>
  );
}
