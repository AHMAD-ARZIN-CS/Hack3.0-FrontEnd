import type { Metadata } from "next";
import { AddCourse } from "./AddCourse";

export const metadata: Metadata = { title: "Add a course" };

export default function AddCoursePage() {
  return <AddCourse />;
}
