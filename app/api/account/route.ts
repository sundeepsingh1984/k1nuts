import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  customerAddresses,
  customerOrders,
  customerProfiles,
  orderItems,
  taxInvoices,
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
    const invoices = await db
      .select({
        id: taxInvoices.id,
        orderId: taxInvoices.orderId,
        invoiceNumber: taxInvoices.invoiceNumber,
        status: taxInvoices.status,
      })
      .from(taxInvoices)
      .where(eq(taxInvoices.userId, user.userId));

    return Response.json(
      {
        profile,
        addresses,
        orders: orders.map((order) => ({
          ...order,
          items: items.filter((item) => item.orderId === order.id),
          invoice:
            invoices.find((invoice) => invoice.orderId === order.id) ?? null,
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
      billingLegalName?: string;
      billingGstin?: string;
      marketingOptIn?: boolean;
      whatsappMarketingOptIn?: boolean;
    };
    const displayName = body.displayName?.trim().slice(0, 80);
    const phone = body.phone?.trim().slice(0, 24) ?? "";
    const billingLegalName = body.billingLegalName?.trim().slice(0, 120) || null;
    const billingGstin = body.billingGstin?.trim().toUpperCase().slice(0, 15) || null;
    if (!displayName) {
      return Response.json(
        { error: "Display name is required" },
        { status: 400 },
      );
    }
    if (body.whatsappMarketingOptIn && !phone) {
      return Response.json(
        { error: "Add a mobile number before enabling WhatsApp offers." },
        { status: 400 },
      );
    }
    if (
      billingGstin &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
        billingGstin,
      )
    ) {
      return Response.json(
        { error: "Enter a valid 15-character GSTIN or leave it blank." },
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
        billingLegalName,
        billingGstin,
        marketingOptIn: Boolean(body.marketingOptIn),
        whatsappMarketingOptIn: Boolean(body.whatsappMarketingOptIn),
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: customerProfiles.userId,
        set: {
          email: user.email,
          displayName,
          phone,
          billingLegalName,
          billingGstin,
          marketingOptIn: Boolean(body.marketingOptIn),
          whatsappMarketingOptIn: Boolean(body.whatsappMarketingOptIn),
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
