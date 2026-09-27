/**
 * Onboarding options (D33). Progressive: only campus is required.
 * Needs are PRIVATE: they shape Home shortcuts and never appear on a profile.
 */
import type { StudentStanding } from "@/types/models";

export const STUDENT_STANDINGS: { id: StudentStanding; label: string; hint: string }[] = [
  { id: "new", label: "New student", hint: "First term here" },
  { id: "continuing", label: "Continuing student", hint: "Been here a while" },
  { id: "transfer-track", label: "Transfer-track", hint: "Planning to transfer" },
  { id: "returning", label: "Returning student", hint: "Back after a break" },
];

export const ONBOARDING_NEEDS: { id: string; label: string; href: string }[] = [
  { id: "study-groups", label: "Study groups", href: "/community?type=study-group" },
  { id: "course-help", label: "Course help", href: "/academic" },
  { id: "campus-events", label: "Campus events", href: "/community?type=event" },
  { id: "housing", label: "Housing", href: "/housing" },
  { id: "food", label: "Food resources", href: "/food" },
  { id: "money", label: "Financial help", href: "/resources?need=money" },
  { id: "jobs", label: "Jobs and internships", href: "/community?type=opportunity" },
];

export const ONBOARDING_STEPS = ["Campus", "About you", "Courses", "Interests", "Welcome"] as const;
