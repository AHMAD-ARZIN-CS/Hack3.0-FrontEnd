import { Suspense } from "react";
import { LoadingList } from "@/components/ui/States";
import { CourseHub } from "./CourseHub";

export default function CoursePage() {
  return (
    <Suspense fallback={<LoadingList />}>
      <CourseHub />
    </Suspense>
  );
}
