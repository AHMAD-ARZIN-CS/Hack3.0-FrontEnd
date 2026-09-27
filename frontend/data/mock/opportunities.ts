/**
 * MOCK OPPORTUNITIES — demonstration data. Not real programs, no real deadlines.
 * Discover › Local opportunities page comes later; for now these render as linked previews.
 * Posting rules (Q24): verified faculty/staff + verified orgs publish, students suggest → moderator review.
 */
import type { Opportunity } from "@/types/models";

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp_summer_research",
    campusId: "chabot",
    title: "Summer undergraduate research program (sample)",
    organization: "Demo STEM Department",
    description: "Sample listing for the demo: paid summer research placement for community college students.",
    deadline: "2026-11-15",
    submittedBy: "staff_rivera",
    source: "faculty-staff",
    reviewStatus: "published",
    isDemo: true,
  },
  {
    id: "opp_robotics_mentor",
    campusId: "chabot",
    title: "Peer mentor for intro robotics workshops (sample)",
    organization: "Demo Robotics Club",
    description: "Help first-year students build their first robot. Volunteer, 2 hours a week.",
    submittedBy: "org_robotics",
    source: "organization",
    reviewStatus: "published",
    isDemo: true,
  },
];
