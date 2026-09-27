/** Food configuration. Edit wording and limits here. */

export const FOOD_HOLD_MINUTES = 45;
export const FOOD_MAX_PER_CLAIM = 2;

export const DIETARY_TAGS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "halal", label: "Halal" },
  { id: "gluten-free", label: "Gluten-free" },
];

export const FOOD_DISTANCE_OPTIONS = [
  { value: "", label: "Any distance" },
  { value: "2", label: "Within 2 mi" },
  { value: "4", label: "Within 4 mi" },
];

export const FOOD_PRICE_OPTIONS = [
  { value: "", label: "Any price" },
  { value: "400", label: "$4 or less" },
  { value: "500", label: "$5 or less" },
];

export const FOOD_COPY = {
  demoNotice: "Sample restaurants for the demo. No real businesses participate yet.",
  noPayment: "East Bay Link doesn't take payments. Pay the restaurant directly when you pick up.",
  allergy: "Surplus food can change day to day. Ask the restaurant about allergens before you eat.",
};
