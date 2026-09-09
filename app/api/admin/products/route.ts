import { eq } from "drizzle-orm";
import { getAdminUser } from "../../../admin-auth";
import { getDb } from "../../../../db";
import { adminProducts, productVariants } from "../../../../db/schema";
import { getCatalogueCategory } from "../../../catalogue-db";

type VariantInput = {
  label?: string;
  weightGrams?: number;
  sku?: string;
  mrp?: number;
  stock?: number;
};

function clean(value: unknown, max = 500) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user)
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  const name = clean(body.name, 100);
  const slug = clean(body.slug, 100)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const categorySlug = clean(body.categorySlug, 60);
  const category = await getCatalogueCategory(categorySlug);
  const variants = Array.isArray(body.variants)
    ? (body.variants as VariantInput[])
    : [];
  if (!name || !slug || !category || !clean(body.image, 500)) {
    return Response.json(
      { error: "Name, slug, category and product image are required." },
      { status: 400 },
    );
  }
  if (variants.length !== 3) {
    return Response.json(
      { error: "Add the 250g, 500g and 1kg variants." },
      { status: 400 },
    );
  }

  const now = Date.now();
  const db = getDb();
  try {
    await db.insert(adminProducts).values({
      name,
      slug,
      category: category.name,
      categorySlug,
      description: clean(body.description, 1600),
      short: clean(body.short, 240),
      accent: clean(body.accent, 20) || category.tone,
      image: clean(body.image, 500),
      badge: clean(body.badge, 60) || "K1 SELECTED",
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(productVariants).values(
      variants.map((variant, index) => {
        const label =
          clean(variant.label, 20) || ["250g", "500g", "1kg"][index];
        const weightGrams =
          Number(variant.weightGrams) || [250, 500, 1000][index];
        const mrp = Math.max(1, Number(variant.mrp) || 0);
        return {
          productSlug: slug,
          label,
          weightGrams,
          sku:
            clean(variant.sku, 80) || `K1-${slug.toUpperCase()}-${weightGrams}`,
          mrpPaise: Math.round(mrp * 100),
          pricePaise: Math.round(mrp * 50),
          stock: Math.max(0, Math.floor(Number(variant.stock) || 0)),
          active: true,
          createdAt: now,
          updatedAt: now,
        };
      }),
    );
  } catch (error) {
    await db
      .delete(adminProducts)
      .where(eq(adminProducts.slug, slug))
      .catch(() => undefined);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to add product.",
      },
      { status: 409 },
    );
  }
  return Response.json({ ok: true, slug }, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Product details are required." }, { status: 400 });
  const name = clean(body.name, 100);
  const slug = clean(body.slug, 100)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const categorySlug = clean(body.categorySlug, 60);
  const category = await getCatalogueCategory(categorySlug);
  const variants = Array.isArray(body.variants)
    ? (body.variants as VariantInput[])
    : [];
  if (!name || !slug || !category || !clean(body.image, 500)) {
    return Response.json(
      { error: "Name, slug, category and product image are required." },
      { status: 400 },
    );
  }
  if (variants.length !== 3) {
    return Response.json(
      { error: "Keep the 250g, 500g and 1kg variants configured." },
      { status: 400 },
    );
  }
  const now = Date.now();
  const db = getDb();
  try {
    await db
      .insert(adminProducts)
      .values({
        name,
        slug,
        category: category.name,
        categorySlug,
        description: clean(body.description, 1600),
        short: clean(body.short, 240),
        accent: clean(body.accent, 20) || category.tone,
        image: clean(body.image, 500),
        badge: clean(body.badge, 60) || "K1 SELECTED",
        active: body.active !== false,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: adminProducts.slug,
        set: {
          name,
          category: category.name,
          categorySlug,
          description: clean(body.description, 1600),
          short: clean(body.short, 240),
          accent: clean(body.accent, 20) || category.tone,
          image: clean(body.image, 500),
          badge: clean(body.badge, 60) || "K1 SELECTED",
          active: body.active !== false,
          updatedAt: now,
        },
      });
    for (const [index, variant] of variants.entries()) {
      const label = clean(variant.label, 20) || ["250g", "500g", "1kg"][index];
      const weightGrams = Number(variant.weightGrams) || [250, 500, 1000][index];
      const mrp = Math.max(1, Number(variant.mrp) || 0);
      const sku = clean(variant.sku, 80) || `K1-${slug.toUpperCase()}-${weightGrams}`;
      await db
        .insert(productVariants)
        .values({
          productSlug: slug,
          label,
          weightGrams,
          sku,
          mrpPaise: Math.round(mrp * 100),
          pricePaise: Math.round(mrp * 50),
          stock: Math.max(0, Math.floor(Number(variant.stock) || 0)),
          active: true,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [productVariants.productSlug, productVariants.label],
          set: {
            weightGrams,
            sku,
            mrpPaise: Math.round(mrp * 100),
            pricePaise: Math.round(mrp * 50),
            stock: Math.max(0, Math.floor(Number(variant.stock) || 0)),
            active: true,
            updatedAt: now,
          },
        });
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update product." },
      { status: 409 },
    );
  }
  return Response.json({ ok: true, slug });
}

export async function PATCH(request: Request) {
  const user = await getAdminUser();
  if (!user)
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const body = (await request.json()) as { slug?: string; active?: boolean };
  const slug = clean(body.slug, 100);
  if (!slug)
    return Response.json(
      { error: "Product slug is required." },
      { status: 400 },
    );
  await getDb()
    .update(adminProducts)
    .set({ active: Boolean(body.active), updatedAt: Date.now() })
    .where(eq(adminProducts.slug, slug));
  return Response.json({ ok: true });
}
