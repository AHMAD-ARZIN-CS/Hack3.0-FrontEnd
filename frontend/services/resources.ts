/**
 * Resource service. The ONLY way UI gets resources.
 * mock mode: filters MOCK_RESOURCES locally.
 * api mode:  GET /resources, GET /resources/:id (see docs/DATA_CONTRACT.md §2, §8)
 */
import { DATA_MODE, NEEDS } from "@/config/app";
import { MOCK_RESOURCES } from "@/data/mock/resources";
import { apiGet } from "@/services/api/client";
import { normalizeResource } from "@/services/api/normalize";
import { mockDelay, NotFoundError } from "@/services/mock";
import { applyPaging, matchesText } from "@/services/query";
import type { CampusId, NeedId, Paged, Resource, ResourceQuery } from "@/types/models";

function servesCampus(r: Resource, campusId: CampusId): boolean {
  if (r.campusId === campusId) return true;
  return r.campusId === "regional" && (!r.servesCampusIds || r.servesCampusIds.includes(campusId));
}

/**
 * Emergency first, then resources whose main category matches the need
 * (pantry before general basic-needs office for "food"), then on-campus, then A–Z.
 */
function makeSorter(need?: NeedId) {
  const primary = NEEDS.find((n) => n.id === need)?.resourceCategories ?? [];
  return (a: Resource, b: Resource): number => {
    if (!!a.isEmergency !== !!b.isEmergency) return a.isEmergency ? -1 : 1;
    const pa = primary.includes(a.category);
    const pb = primary.includes(b.category);
    if (pa !== pb) return pa ? -1 : 1;
    if (a.onCampus !== b.onCampus) return a.onCampus ? -1 : 1;
    return a.title.localeCompare(b.title);
  };
}

export async function getResources(query: ResourceQuery): Promise<Paged<Resource>> {
  if (DATA_MODE === "api") {
    const raw = await apiGet<Paged<unknown>>("/resources", query);
    return { ...raw, items: raw.items.map(normalizeResource) };
  }

  const filtered = MOCK_RESOURCES.filter(
    (r) =>
      servesCampus(r, query.campusId) &&
      (!query.category || r.category === query.category) &&
      (!query.need || r.needs.includes(query.need)) &&
      (query.onCampus === undefined || r.onCampus === query.onCampus) &&
      (!query.verifiedOnly || r.verified) &&
      matchesText(query.q, r.title, r.description, r.provider),
  ).sort(makeSorter(query.need));

  return mockDelay(applyPaging(filtered, query));
}

export async function getResource(id: string): Promise<Resource> {
  if (DATA_MODE === "api") return normalizeResource(await apiGet(`/resources/${encodeURIComponent(id)}`));
  const found = MOCK_RESOURCES.find((r) => r.id === id);
  if (!found) throw new NotFoundError("Resource");
  return mockDelay(found);
}
