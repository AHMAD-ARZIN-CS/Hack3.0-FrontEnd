/**
 * Community configuration (D25). Change labels or rules here, not in components.
 */
import type { AuthorRole, PostType } from "@/types/models";

export const POST_TYPES: {
  id: PostType;
  label: string; // chip + badge text
  plural: string; // filter chip text
  prompt: string; // create-form helper text
  /** Roles allowed to create this type. */
  allowedRoles: AuthorRole[];
  needsMeeting?: boolean;
  needsLink?: boolean;
}[] = [
  { id: "question", label: "Question", plural: "Questions", prompt: "Ask your campus. Someone has probably been there.", allowedRoles: ["student", "faculty-staff", "organization"] },
  { id: "discussion", label: "Discussion", plural: "Discussions", prompt: "Start a conversation about campus life or classes.", allowedRoles: ["student", "faculty-staff", "organization"] },
  { id: "resource-share", label: "Shared resource", plural: "Shared resources", prompt: "Point students to something you made or found useful.", allowedRoles: ["student", "faculty-staff", "organization"], needsLink: true },
  { id: "study-group", label: "Study group", plural: "Study groups", prompt: "Invite classmates to study together.", allowedRoles: ["student", "faculty-staff", "organization"], needsMeeting: true },
  { id: "event", label: "Event", plural: "Events", prompt: "Share an event students can attend.", allowedRoles: ["student", "faculty-staff", "organization"], needsMeeting: true },
  { id: "opportunity", label: "Opportunity", plural: "Opportunities", prompt: "Jobs, research, scholarships, programs.", allowedRoles: ["student", "faculty-staff", "organization"] },
  { id: "announcement", label: "Announcement", plural: "Announcements", prompt: "Updates from verified faculty, staff, or organizations.", allowedRoles: ["faculty-staff", "organization"] },
];

export const ROLE_LABELS: Record<AuthorRole, string> = {
  student: "Student",
  "faculty-staff": "Faculty/Staff",
  organization: "Organization",
};

export const COMMUNITY_LIMITS = {
  titleMax: 120,
  bodyMin: 10,
  bodyMax: 2000,
  commentMax: 1000,
  tagsMax: 3,
  tagMaxLength: 24,
} as const;

export function postTypeLabel(id: PostType): string {
  return POST_TYPES.find((t) => t.id === id)?.label ?? id;
}
