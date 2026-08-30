import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  customerAddresses,
  customerOrders,
  customerProfiles,
  orderItems,
} from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

async function requireApiUser() {
  const user = await getChatGPTUser();
  if (!user) return null;
  return user;
}

export async function GET() {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getDb();
    const now = Date.now();
    await db
      .insert(customerProfiles)
      .values({
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: customerProfiles.userId,
        set: { email: user.email, updatedAt: now },
      });

    const [profile] = await db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, user.userId))
      .limit(1);
    const addresses = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, user.userId))
      .orderBy(
        desc(customerAddresses.isDefault),
        desc(customerAddresses.updatedAt),
      );
    const orders = await db
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.userId, user.userId))
      .orderBy(desc(customerOrders.placedAt))
      .limit(50);
    const items = orders.length
      ? await db
          .select()
          .from(orderItems)
          .where(
            inArray(
              orderItems.orderId,
              orders.map((order) => order.id),
            ),
          )
      : [];

    return Response.json(
      {
        profile,
        addresses,
        orders: orders.map((order) => ({
          ...order,
          items: items.filter((item) => item.orderId === order.id),
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Account data is temporarily unavailable" },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  const user = await requireApiUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as {
      displayName?: string;
      phone?: string;
      marketingOptIn?: boolean;
    };
    const displayName = body.displayName?.trim().slice(0, 80);
    const phone = body.phone?.trim().slice(0, 24) ?? "";
    if (!displayName) {
      return Response.json(
        { error: "Display name is required" },
        { status: 400 },
      );
    }

    const db = getDb();
    const now = Date.now();
    await db
      .insert(customerProfiles)
      .values({
        userId: user.userId,
        email: user.email,
        displayName,
        phone,
        marketingOptIn: Boolean(body.marketingOptIn),
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: customerProfiles.userId,
        set: {
          email: user.email,
          displayName,
          phone,
          marketingOptIn: Boolean(body.marketingOptIn),
          updatedAt: now,
        },
      });
    const [profile] = await db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, user.userId))
      .limit(1);
    return Response.json({ profile });
  } catch {
    return Response.json({ error: "Unable to save profile" }, { status: 500 });
  }
}
