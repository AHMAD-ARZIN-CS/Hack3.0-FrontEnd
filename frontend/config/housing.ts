/**
 * Housing configuration (D22, D28). Edit lists and wording here.
 *
 * Areas: posters pick an approximate area, never type an address. Distances are rough
 * straight-line estimates from each campus center, rounded to 0.5 mi, for demo purposes.
 */
import type { CampusId } from "@/types/models";

export interface HousingArea {
  id: string;
  name: string;
  /** Approximate miles from campus center. Missing = too far to list for that campus. */
  milesFrom: Partial<Record<CampusId, number>>;
}

export const HOUSING_AREAS: HousingArea[] = [
  { id: "downtown-hayward", name: "Downtown Hayward", milesFrom: { chabot: 2, csueb: 1.5 } },
  { id: "hayward-hills", name: "Hayward Hills", milesFrom: { chabot: 3, csueb: 1 } },
  { id: "south-hayward", name: "South Hayward", milesFrom: { chabot: 3.5, csueb: 3 } },
  { id: "castro-valley", name: "Castro Valley", milesFrom: { chabot: 3.5, csueb: 3.5 } },
  { id: "san-leandro", name: "San Leandro", milesFrom: { chabot: 6, csueb: 6.5 } },
  { id: "union-city", name: "Union City", milesFrom: { chabot: 5.5, csueb: 5.5 } },
  { id: "pleasant-hill", name: "Pleasant Hill", milesFrom: { dvc: 1 } },
  { id: "concord", name: "Concord", milesFrom: { dvc: 3.5 } },
  { id: "walnut-creek", name: "Walnut Creek", milesFrom: { dvc: 3.5 } },
  { id: "martinez", name: "Martinez", milesFrom: { dvc: 4.5 } },
];

export function areasForCampus(campusId: CampusId): (HousingArea & { miles: number })[] {
  return HOUSING_AREAS.filter((a) => a.milesFrom[campusId] !== undefined)
    .map((a) => ({ ...a, miles: a.milesFrom[campusId]! }))
    .sort((a, b) => a.miles - b.miles);
}

export const HOUSING_AMENITIES = [
  { id: "furnished", label: "Furnished" },
  { id: "utilities-included", label: "Utilities included" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "laundry", label: "Laundry" },
  { id: "parking", label: "Parking" },
  { id: "private-bath", label: "Private bathroom" },
  { id: "near-transit", label: "Near bus/BART" },
  { id: "kitchen", label: "Kitchen access" },
];

/**
 * Lifestyle preferences ONLY. Never add race, religion, national origin, sex, gender,
 * familial status, disability, age, or other protected traits (fair housing, D28).
 */
export const HOUSING_PREFERENCES = [
  { id: "quiet", label: "Quiet home" },
  { id: "study-focused", label: "Study-focused" },
  { id: "non-smoking", label: "Non-smoking" },
  { id: "early-riser", label: "Early riser" },
  { id: "night-owl", label: "Night owl" },
  { id: "pets-ok", label: "Pets OK" },
  { id: "no-pets", label: "No pets" },
  { id: "guests-ok", label: "Guests OK" },
];

export const BUDGET_OPTIONS = [
  { value: "", label: "Any price" },
  { value: "80000", label: "Up to $800" },
  { value: "100000", label: "Up to $1,000" },
  { value: "120000", label: "Up to $1,200" },
  { value: "150000", label: "Up to $1,500" },
];

export const DISTANCE_OPTIONS = [
  { value: "", label: "Any distance" },
  { value: "2", label: "Within 2 mi" },
  { value: "4", label: "Within 4 mi" },
  { value: "7", label: "Within 7 mi" },
];

/** Value = days from today. */
export const AVAILABILITY_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "0", label: "Available now" },
  { value: "30", label: "Within 1 month" },
  { value: "90", label: "Within 3 months" },
];

export const HOUSING_LIMITS = {
  titleMax: 80,
  descriptionMin: 20,
  descriptionMax: 1200,
  messageMax: 300,
  priceMinCents: 10000, // $100
  priceMaxCents: 500000, // $5,000
} as const;

export const HOUSING_SAFETY = {
  verification:
    "“Verified student” means the person confirmed they are a current student. It is not a background check and does not mean a person or place is safe.",
  tips: [
    "Meet in a public place first, and bring a friend when you visit.",
    "Never send a deposit, rent, or payment before you see the place in person and sign a lease.",
    "Never share your SSN, bank login, or financial documents in a first conversation.",
    "Check that the lease or landlord allows a roommate or sublet.",
    "Trust your instincts. Report anything that feels off.",
  ],
  fairHousing: "Listings must follow fair housing laws. Preferences are about lifestyle only.",
};
