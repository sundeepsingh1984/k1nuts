import { and, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "../db";
import { adminProducts, productVariants, storeCategories } from "../db/schema";
import {
  getCategoryProducts,
  getProduct,
  products,
  categories,
  type StoreCategory,
  type ProductVariant,
  type StoreProduct,
} from "./store-data";

type ProductRow = typeof adminProducts.$inferSelect;
type VariantRow = typeof productVariants.$inferSelect;
type CategoryRow = typeof storeCategories.$inferSelect;

function mapCategory(row: CategoryRow): StoreCategory {
  return {
    slug: row.slug,
    name: row.name,
    kicker: row.kicker,
    description: row.description,
    emoji: row.emoji,
    tone: row.tone,
    image: row.image,
  };
}

export const getCatalogueCategories = cache(async function getCatalogueCategories() {
  try {
    const overrides = await getDb()
      .select()
      .from(storeCategories)
      .orderBy(storeCategories.sortOrder, storeCategories.name);
    const overrideMap = new Map(overrides.map((category) => [category.slug, category]));
    const builtInSlugs = new Set(categories.map((category) => category.slug));
    return [
      ...categories.map((category, index) => {
        const override = overrideMap.get(category.slug);
        return {
          category: override ? mapCategory(override) : category,
          active: override?.active ?? true,
          sortOrder: override?.sortOrder ?? index * 10,
        };
      }),
      ...overrides
        .filter((category) => !builtInSlugs.has(category.slug))
        .map((category) => ({
          category: mapCategory(category),
          active: category.active,
          sortOrder: category.sortOrder,
        })),
    ]
      .filter((entry) => entry.active)
      .sort(
        (left, right) =>
          left.sortOrder - right.sortOrder ||
          left.category.name.localeCompare(right.category.name),
      )
      .map((entry) => entry.category);
  } catch {
    return categories;
  }
});

export const getCatalogueCategory = cache(async function getCatalogueCategory(
  slug: string,
) {
  const catalogueCategories = await getCatalogueCategories();
  return catalogueCategories.find((category) => category.slug === slug);
});

function mapProduct(row: ProductRow, variants: VariantRow[]): StoreProduct {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    categorySlug: row.categorySlug,
    description: row.description,
    short: row.short,
    price: (variants[0]?.pricePaise ?? 0) / 100,
    mrp: (variants[0]?.mrpPaise ?? 0) / 100,
    weight: variants[0]?.label ?? "250g",
    accent: row.accent,
    image: row.image,
    emoji: "K1",
    badge: row.badge,
    benefits: [
      "Quality graded",
      "Freshness packed",
      "Multiple pack sizes",
      "K1 selected",
    ],
    variants: variants.map((variant): ProductVariant => ({
      label: variant.label,
      weightGrams: variant.weightGrams,
      sku: variant.sku,
      price: variant.pricePaise / 100,
      mrp: variant.mrpPaise / 100,
      stock: variant.stock,
    })),
  };
}

async function loadCustomRows(categorySlug?: string, productSlug?: string) {
  const db = getDb();
  const condition = productSlug
    ? and(eq(adminProducts.slug, productSlug), eq(adminProducts.active, true))
    : categorySlug
      ? and(
          eq(adminProducts.categorySlug, categorySlug),
          eq(adminProducts.active, true),
        )
      : eq(adminProducts.active, true);
  const rows = await db.select().from(adminProducts).where(condition);
  if (!rows.length) return [];
  const slugs = rows.map((row) => row.slug);
  const variants = await db
    .select()
    .from(productVariants)
    .where(
      and(
        inArray(productVariants.productSlug, slugs),
        eq(productVariants.active, true),
      ),
    );
  return rows.map((row) =>
    mapProduct(
      row,
      variants.filter((variant) => variant.productSlug === row.slug),
    ),
  );
}

export const getCategoryCatalogue = cache(async function getCategoryCatalogue(
  categorySlug: string,
) {
  const builtIn = getCategoryProducts(categorySlug);
  try {
    const custom = await loadCustomRows(categorySlug);
    const customSlugs = new Set(custom.map((product) => product.slug));
    return [
      ...builtIn.filter((product) => !customSlugs.has(product.slug)),
      ...custom,
    ];
  } catch {
    return builtIn;
  }
});

export const getCatalogueProduct = cache(async function getCatalogueProduct(
  slug: string,
) {
  try {
    const [custom] = await loadCustomRows(undefined, slug);
    if (custom) return custom;
  } catch {
    // Build and local preview can run before D1 migrations are applied.
  }
  return getProduct(slug);
});

export const getAllCatalogueProducts = cache(async function getAllCatalogueProducts() {
  try {
    const custom = await loadCustomRows();
    const customSlugs = new Set(custom.map((product) => product.slug));
    return [
      ...products.filter((product) => !customSlugs.has(product.slug)),
      ...custom,
    ];
  } catch {
    return products;
  }
});
