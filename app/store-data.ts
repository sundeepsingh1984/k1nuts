export type StoreProduct = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  short: string;
  price: number;
  mrp: number;
  weight: string;
  accent: string;
  image?: string;
  emoji: string;
  ingredients?: string[];
  benefits?: string[];
  composition?: Array<[string, number]>;
  badge?: string;
};

export const categories = [
  {
    slug: "healthy-snacks",
    name: "Healthy Snacks",
    kicker: "The signature collection",
    description:
      "Date, nut, seed and cocoa bites inspired by Kashmir and made for everyday energy.",
    emoji: "●",
    tone: "#4d2a18",
    image: "/categories/healthy-snacks.png",
  },
  {
    slug: "nuts",
    name: "Nuts",
    kicker: "Rare origins",
    description:
      "Almonds, pistachios, walnuts and exceptional kernels selected by origin and grade.",
    emoji: "◒",
    tone: "#8a5a2b",
    image: "/categories/nuts.png",
  },
  {
    slug: "dry-fruits-berries",
    name: "Dry Fruits & Berries",
    kicker: "Naturally vibrant",
    description:
      "Figs, berries, raisins and orchard fruit chosen for texture, colour and natural sweetness.",
    emoji: "✦",
    tone: "#6a3f58",
    image: "/categories/dry-fruits-berries.png",
  },
  {
    slug: "spices-herbs",
    name: "Spices & Herbs",
    kicker: "The fragrant pantry",
    description:
      "Pure, aromatic pantry essentials rooted in Himalayan food culture.",
    emoji: "⌁",
    tone: "#58613b",
    image: "/categories/spices-herbs.png",
  },
  {
    slug: "cold-pressed-oils",
    name: "Cold-Pressed Oils",
    kicker: "Slow pressed",
    description:
      "Small-batch oils created for flavour, nourishment and everyday rituals.",
    emoji: "◉",
    tone: "#7b6b28",
    image: "/categories/cold-pressed-oils.png",
  },
];

const healthy: StoreProduct[] = [
  {
    slug: "kashmiri-mewa-bites",
    name: "Kashmiri Mewa Bites",
    category: "Healthy Snacks",
    categorySlug: "healthy-snacks",
    description:
      "A traditional blend of premium dry fruits, seeds and nuts with the richness of saffron. Naturally sweetened with dates, these jewel-like bites bring Kashmiri warmth to busy days.",
    short: "Saffron-infused date, nut and seed bites.",
    price: 599,
    mrp: 599,
    weight: "250g",
    accent: "#5e3b78",
    image: "/products/kashmiri-mewa-bites.png",
    emoji: "✦",
    badge: "CORE RANGE",
    ingredients: [
      "Dates",
      "Almonds",
      "Cashews",
      "Walnuts",
      "Pumpkin seeds",
      "Sunflower seeds",
      "Raisins",
      "Cranberries",
      "Coconut",
      "Ghee",
      "Saffron",
      "Cardamom",
    ],
    benefits: [
      "No added sugar",
      "Natural ingredients",
      "Rich in nutrition",
      "Made in Kashmir",
    ],
    composition: [
      ["Dates", 40],
      ["Nuts & seeds", 55],
      ["Others", 5],
    ],
  },
  {
    slug: "chocolate-truffle-bites",
    name: "Chocolate Truffle Bites",
    category: "Healthy Snacks",
    categorySlug: "healthy-snacks",
    description:
      "Real cocoa, premium nuts and dates meet in a deeply chocolatey bite. Soft, rich and satisfying, with natural vanilla and cinnamon for a rounded finish.",
    short: "Real cocoa and premium nuts, naturally sweetened.",
    price: 699,
    mrp: 699,
    weight: "250g",
    accent: "#3d2117",
    image: "/products/chocolate-truffle-bites.png",
    emoji: "◆",
    badge: "PREMIUM RANGE",
    ingredients: [
      "Dates",
      "Almonds",
      "Cashews",
      "Cocoa powder",
      "Cocoa mass",
      "Walnuts",
      "Coconut",
      "Ghee",
      "Cinnamon",
      "Natural vanilla",
    ],
    benefits: [
      "Real cocoa",
      "Naturally sweetened",
      "Nuts & seeds",
      "No artificial additives",
    ],
    composition: [
      ["Dates", 45],
      ["Nuts", 40],
      ["Cocoa", 12],
      ["Others", 3],
    ],
  },
  {
    slug: "walnut-chocolate-fudge",
    name: "Walnut Chocolate Fudge",
    category: "Healthy Snacks",
    categorySlug: "healthy-snacks",
    description:
      "A luxurious blend of walnuts and wholesome ingredients crafted into fudgy, satisfying bites. Pure, natural and packed with the goodness of walnut-rich nutrition.",
    short: "Fudgy cocoa bites with generous walnut pieces.",
    price: 799,
    mrp: 799,
    weight: "250g",
    accent: "#35512d",
    image: "/products/walnut-chocolate-fudge.png",
    emoji: "◉",
    badge: "SUPER PREMIUM",
    ingredients: [
      "Dates",
      "Walnuts",
      "Almonds",
      "Cocoa powder",
      "Cocoa mass",
      "Coconut",
      "Ghee",
      "Cinnamon",
      "Natural vanilla",
    ],
    benefits: [
      "Walnut rich",
      "High in fibre",
      "Natural ingredients",
      "Small batch",
    ],
    composition: [
      ["Dates", 40],
      ["Walnuts", 30],
      ["Cocoa", 12],
      ["Others", 18],
    ],
  },
  {
    slug: "peanut-chocolate-bites",
    name: "Peanut Chocolate Bites",
    category: "Healthy Snacks",
    categorySlug: "healthy-snacks",
    description:
      "Roasted peanuts, cocoa and dates come together in a deliciously crunchy, everyday bite. A familiar flavour made more nourishing and deeply satisfying.",
    short: "Roasted peanut crunch with dates and cocoa.",
    price: 499,
    mrp: 499,
    weight: "250g",
    accent: "#c75d13",
    image: "/products/peanut-chocolate-bites.png",
    emoji: "●",
    badge: "VALUE RANGE",
    ingredients: [
      "Dates",
      "Peanuts",
      "Coconut powder",
      "Cocoa powder",
      "Cocoa mass",
      "Ghee",
      "Cinnamon",
      "Natural vanilla",
    ],
    benefits: [
      "Energy booster",
      "Peanut protein",
      "No added sugar",
      "Everyday value",
    ],
    composition: [
      ["Dates", 45],
      ["Peanuts", 30],
      ["Cocoa", 7],
      ["Others", 18],
    ],
  },
];

const catalogueGroups: Array<[string, string, string[]]> = [
  [
    "nuts",
    "Almonds",
    [
      "Kashmiri Mamra",
      "California Regular",
      "California Sonora",
      "In-shell Kashmiri Regular",
      "Papershell Almonds",
    ],
  ],
  [
    "nuts",
    "Pistachios",
    [
      "Salted Irani Pistachios",
      "Salted California Pistachios",
      "Shelled California Pistachios",
      "Shelled Salted Pistachios",
    ],
  ],
  [
    "nuts",
    "Walnuts",
    [
      "Paper Kashmir Walnuts",
      "Regular Kashmiri Walnuts",
      "Chilean Walnuts",
      "California Walnuts",
      "Snow White Halves",
      "Light Halves",
      "Light Quarters",
    ],
  ],
  [
    "nuts",
    "Speciality Nuts",
    [
      "Raw Hazelnuts",
      "Roasted Hazelnuts",
      "In-shell Macadamia",
      "Shelled Macadamia",
      "In-shell Pine Nuts",
      "Shelled Pine Nuts",
      "In-shell Pecan Nuts",
      "Shelled Pecan Nuts",
    ],
  ],
  ["nuts", "Cashews", ["Cashew W-320", "Cashew W-240", "Cashew W-180"]],
  [
    "dry-fruits-berries",
    "Berries & Fruit",
    [
      "Dried Blueberries",
      "Goji Berries",
      "Cranberries",
      "Dried Cherries",
      "Dried Apricots",
      "Turkish Figs",
      "Afghani Anjeer",
      "Green Raisins",
      "Black Raisins",
    ],
  ],
  [
    "spices-herbs",
    "Spices & Herbs",
    [
      "Kashmiri Saffron",
      "Green Cardamom",
      "Ceylon Cinnamon",
      "Kashmiri Kahwa Herbs",
    ],
  ],
  [
    "cold-pressed-oils",
    "Cold-Pressed Oils",
    ["Walnut Oil", "Almond Oil", "Mustard Oil", "Apricot Kernel Oil"],
  ],
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const catalogueProducts: StoreProduct[] = catalogueGroups.flatMap(
  ([categorySlug, group, names], groupIndex) =>
    names.map((name, index) => ({
      slug: slugify(name),
      name,
      category: group,
      categorySlug,
      description: `${name} selected for clean flavour, natural texture and dependable K1 quality. Packed fresh in Kashmir after careful grading and quality checks.`,
      short: `Premium ${name.toLowerCase()}, selected and freshness packed.`,
      price: 499 + ((groupIndex + index) % 5) * 100,
      mrp: 599 + ((groupIndex + index) % 5) * 100,
      weight: "250g",
      accent:
        categories.find((c) => c.slug === categorySlug)?.tone ?? "#8a5a2b",
      emoji:
        categorySlug === "nuts"
          ? "◒"
          : categorySlug === "dry-fruits-berries"
            ? "✦"
            : "⌁",
      benefits: [
        "Quality graded",
        "Freshness packed",
        "No artificial colours",
        "K1 selected",
      ],
    })),
);

export const products = [...healthy, ...catalogueProducts];
export const healthyProducts = healthy;
export const getProduct = (slug: string) =>
  products.find((product) => product.slug === slug);
export const getCategory = (slug: string) =>
  categories.find((category) => category.slug === slug);
export const getCategoryProducts = (slug: string) =>
  products.filter((product) => product.categorySlug === slug);
