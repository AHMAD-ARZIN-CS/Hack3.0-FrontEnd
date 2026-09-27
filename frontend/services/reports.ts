/**
 * Content reports (moderation prep). Used by Community now, Academic/Housing later.
 * mock: stored in memory. api: POST /reports. Reporter identity stays server-side.
 */
import { DATA_MODE } from "@/config/app";
import { apiPost } from "@/services/api/client";
import { mockDelay } from "@/services/mock";
import type { ContentReportInput } from "@/types/models";

const reports: (ContentReportInput & { id: string; createdAt: string })[] = [];

export async function reportContent(input: ContentReportInput): Promise<{ id: string }> {
  if (DATA_MODE === "api") return apiPost<{ id: string }>("/reports", input);
  const id = `rep_${reports.length + 1}`;
  reports.push({ ...input, details: input.details?.slice(0, 500), id, createdAt: new Date().toISOString() });
  return mockDelay({ id }, 150);
}
