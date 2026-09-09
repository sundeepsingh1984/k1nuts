import { eq } from "drizzle-orm";
import { getAdminUser } from "../../../admin-auth";
import { getDb } from "../../../../db";
import { storeCategories } from "../../../../db/schema";

function clean(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function categoryInput(body: Record<string, unknown>) {
  const name = clean(body.name, 90);
  const slug = clean(body.slug, 90)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return {
    name,
    slug,
    kicker: clean(body.kicker, 120) || "K1 curated collection",
    description: clean(body.description, 700),
    emoji: clean(body.emoji, 8) || "✦",
    tone: /^#[0-9a-f]{6}$/i.test(clean(body.tone, 20))
      ? clean(body.tone, 20)
      : "#356055",
    image: clean(body.image, 500),
    active: body.active !== false,
    sortOrder: Math.max(0, Math.min(999, Number(body.sortOrder) || 100)),
  };
}

async function save(request: Request, createOnly: boolean) {
  if (!(await getAdminUser())) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Category details are required." }, { status: 400 });
  const input = categoryInput(body);
  if (!input.name || !input.slug || !input.description || !input.image) {
    return Response.json(
      { error: "Name, URL slug, description and image are required." },
      { status: 400 },
    );
  }
  const db = getDb();
  const [existing] = await db
    .select({ id: storeCategories.id })
    .from(storeCategories)
    .where(eq(storeCategories.slug, input.slug))
    .limit(1);
  if (createOnly && existing) {
    return Response.json({ error: "That category URL already exists." }, { status: 409 });
  }
  const now = Date.now();
  await db
    .insert(storeCategories)
    .values({ ...input, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: storeCategories.slug,
      set: { ...input, updatedAt: now },
    });
  return Response.json({ ok: true, slug: input.slug }, { status: createOnly ? 201 : 200 });
}

export async function POST(request: Request) {
  return save(request, true);
}

export async function PUT(request: Request) {
  return save(request, false);
}

export async function PATCH(request: Request) {
  if (!(await getAdminUser())) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    slug?: unknown;
    active?: unknown;
  } | null;
  const slug = clean(body?.slug, 90);
  if (!slug) return Response.json({ error: "Category slug is required." }, { status: 400 });
  await getDb()
    .update(storeCategories)
    .set({ active: Boolean(body?.active), updatedAt: Date.now() })
    .where(eq(storeCategories.slug, slug));
  return Response.json({ ok: true });
}
