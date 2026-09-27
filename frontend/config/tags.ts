/**
 * Tag categories (DECISIONS D24). Each category is its own list. Never merge them into one array.
 * ACADEMIC tags are courses and come from the course service, not from here.
 * Add a tag = add one line. Ids are stable; labels can change.
 */

export interface TagOption {
  id: string;
  label: string;
}

/** INTERESTS: personal interests, used for connecting students (not ranking). */
export const INTEREST_TAGS: TagOption[] = [
  { id: "soccer", label: "Soccer" },
  { id: "basketball", label: "Basketball" },
  { id: "hiking", label: "Hiking" },
  { id: "programming", label: "Programming" },
  { id: "gaming", label: "Gaming" },
  { id: "music", label: "Music" },
  { id: "art", label: "Art & design" },
  { id: "cooking", label: "Cooking" },
  { id: "photography", label: "Photography" },
  { id: "volunteering", label: "Volunteering" },
  { id: "entrepreneurship", label: "Entrepreneurship" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "data-science", label: "Data science" },
  { id: "transfer", label: "Transfer prep" },
];

/** MARKETPLACE: categories a student is interested in exchanging (profile tags). Listing categories live in config/marketplace.ts. */
export const MARKETPLACE_TAGS: TagOption[] = [
  { id: "books", label: "Books" },
  { id: "supplies", label: "School supplies" },
  { id: "electronics", label: "Electronics" },
  { id: "clothing", label: "Clothing" },
  { id: "furniture", label: "Furniture" },
];

/** NEEDS / OFFERINGS categories. Used by ProfileOffering.category. */
export const OFFERING_CATEGORIES: TagOption[] = [
  { id: "housing", label: "Housing" },
  { id: "marketplace", label: "Marketplace" },
  { id: "food", label: "Food" },
  { id: "study-group", label: "Study group" },
  { id: "tutoring", label: "Tutoring" },
  { id: "rides", label: "Rides / carpool" },
];

export function tagLabel(list: TagOption[], id: string): string {
  return list.find((t) => t.id === id)?.label ?? id;
}
