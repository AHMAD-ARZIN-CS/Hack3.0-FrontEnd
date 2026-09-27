/**
 * Marketplace configuration (D31). Edit categories, limits, rules, and wording here.
 *
 * Scope: physical items students exchange. Textbooks, school supplies, clothing,
 * appropriate electronics, small dorm/apartment items, other small items. Furniture is not a demo
 * category (Q23). $1,000 cap stays. No trade field. Marketplace stays secondary: keep it simple.
 */
import type { ItemCondition, ListingCategory } from "@/types/models";

export const LISTING_CATEGORIES: { id: ListingCategory; label: string; hint: string }[] = [
  { id: "textbook", label: "Textbooks", hint: "Printed books and access codes still sealed" },
  { id: "supplies", label: "School supplies", hint: "Calculators, lab kits, art supplies, backpacks" },
  { id: "clothing", label: "Clothing", hint: "Clean, wearable clothes and shoes" },
  { id: "electronics", label: "Electronics", hint: "Laptops, tablets, chargers, headphones" },
  { id: "dorm", label: "Dorm & apartment", hint: "Small items: lamps, storage, kitchen basics. No furniture." },
  { id: "other", label: "Other", hint: "Small items that fit the rules" },
];

export const ITEM_CONDITIONS: { id: ItemCondition; label: string }[] = [
  { id: "new", label: "New" },
  { id: "like-new", label: "Like new" },
  { id: "good", label: "Good" },
  { id: "fair", label: "Fair" },
];

/** Price filter. "0" = free only. Values in cents. */
export const LISTING_PRICE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Any price" },
  { value: "0", label: "Free" },
  { value: "1000", label: "Up to $10" },
  { value: "2500", label: "Up to $25" },
  { value: "5000", label: "Up to $50" },
  { value: "10000", label: "Up to $100" },
];

export const MARKETPLACE_LIMITS = {
  titleMin: 3,
  titleMax: 80,
  descriptionMin: 10,
  descriptionMax: 1000,
  messageMax: 300,
  /** $0 (free) to $1,000. A cap keeps this a student exchange. Open question Q23. */
  priceMaxCents: 100000,
  imagesMax: 4,
  imageMaxBytes: 5 * 1024 * 1024,
  imageTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

/**
 * Items that belong elsewhere or are not allowed. Checked against title + description.
 * Order matters: the first match decides the message.
 * Kept narrow on purpose to avoid blocking normal listings ("notes in the margins" is fine).
 */
export const LISTING_RULES: { pattern: RegExp; message: string; href?: string }[] = [
  {
    pattern: /\b(answer keys?|test banks?|solutions? manuals?|past exams?|old exams?|exam answers?|midterm answers?|final answers?)\b/i,
    message: "Exams, answer keys, test banks, and solution manuals aren't allowed.",
  },
  {
    pattern: /\b(pdf|ebook|e-book|scanned|scan of|digital copy)\b/i,
    message: "Digital copies and PDFs of textbooks aren't allowed. List printed books only.",
  },
  {
    pattern: /\b(lecture notes|class notes|study notes|study guides?|notes? (packet|bundle))\b/i,
    message: "Notes and study guides go in Academic Exchange, where they're shared for free.",
    href: "/academic",
  },
  {
    pattern: /\b(room for rent|for rent|sublease|sublet|roommate|move[- ]in)\b/i,
    message: "Rooms and roommates go in Housing.",
    href: "/housing",
  },
  {
    pattern: /\b(homemade food|home[- ]cooked|meal prep|plates for sale|food plates)\b/i,
    message: "Food isn't sold in Marketplace. See Food in Discover.",
    href: "/food",
  },
  {
    pattern: /\b(alcohol|beer|wine|liquor|vapes?|vaping|nicotine|weed|cannabis|thc|edibles|pills|prescription|adderall|guns?|firearms?|ammo|ammunition|fake id)\b/i,
    message: "This item isn't allowed in Marketplace.",
  },
];

/** Blocks advance payment and shipping, the most common ways student sales turn into scams. */
export const ADVANCE_PAYMENT_PATTERN =
  /\b(deposit|wire transfer|gift cards?|send (me )?money|pay (first|upfront|up front|in advance|before)|shipping|will ship|ship it)\b/i;

export const MARKETPLACE_COPY = {
  noPayment: "East Bay Link doesn't process payments. Pay in person when you meet, after you see the item.",
  safetyShort: "Meet on campus in a public place. Never pay in advance.",
  safetyTips: [
    "Meet on campus in a busy, public place during the day. The library entrance or student center works well.",
    "Look at the item before you pay. Test electronics.",
    "Never pay in advance, send a deposit, or buy gift cards.",
    "Don't share your address. Keep chatting in East Bay Link until you're ready to meet.",
    "Bring a friend if you can. Trust your instincts and leave if something feels wrong.",
  ],
  verification: "Verified means the seller is a current student. It does not guarantee the item or the sale.",
  demoNotice: "Demo listings. These are sample items from demo students, not real sales.",
} as const;
