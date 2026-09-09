import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { customerAddresses } from "../../../../db/schema";
import { getCustomerUser } from "../../../customer-auth";

type AddressInput = {
  id?: number;
  label?: string;
  recipientName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
};

function cleanAddress(body: AddressInput) {
  return {
    label: body.label?.trim().slice(0, 30) || "Home",
    recipientName: body.recipientName?.trim().slice(0, 80) ?? "",
    phone: body.phone?.trim().slice(0, 24) ?? "",
    line1: body.line1?.trim().slice(0, 160) ?? "",
    line2: body.line2?.trim().slice(0, 160) || null,
    city: body.city?.trim().slice(0, 80) ?? "",
    state: body.state?.trim().slice(0, 80) ?? "",
    postalCode: body.postalCode?.trim().slice(0, 12) ?? "",
    country: body.country?.trim().slice(0, 60) || "India",
    isDefault: Boolean(body.isDefault),
  };
}

function isValidAddress(address: ReturnType<typeof cleanAddress>) {
  return (
    address.recipientName.length >= 2 &&
    address.phone.length >= 8 &&
    address.line1.length >= 5 &&
    address.city.length >= 2 &&
    address.state.length >= 2 &&
    /^[A-Za-z0-9 -]{4,12}$/.test(address.postalCode)
  );
}

export async function POST(request: Request) {
  const user = await getCustomerUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const address = cleanAddress((await request.json()) as AddressInput);
    if (!isValidAddress(address)) {
      return Response.json(
        { error: "Please complete every required address field" },
        { status: 400 },
      );
    }
    const db = getDb();
    if (address.isDefault) {
      await db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.userId, user.userId));
    }
    const now = Date.now();
    const [created] = await db
      .insert(customerAddresses)
      .values({
        ...address,
        userId: user.userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return Response.json({ address: created }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to save address" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getCustomerUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as AddressInput;
    const address = cleanAddress(body);
    if (!body.id || !isValidAddress(address)) {
      return Response.json({ error: "Invalid address" }, { status: 400 });
    }
    const db = getDb();
    if (address.isDefault) {
      await db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.userId, user.userId));
    }
    const [updated] = await db
      .update(customerAddresses)
      .set({ ...address, updatedAt: Date.now() })
      .where(
        and(
          eq(customerAddresses.id, body.id),
          eq(customerAddresses.userId, user.userId),
        ),
      )
      .returning();
    if (!updated)
      return Response.json({ error: "Address not found" }, { status: 404 });
    return Response.json({ address: updated });
  } catch {
    return Response.json(
      { error: "Unable to update address" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getCustomerUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid address" }, { status: 400 });
  }
  try {
    const db = getDb();
    await db
      .delete(customerAddresses)
      .where(
        and(
          eq(customerAddresses.id, id),
          eq(customerAddresses.userId, user.userId),
        ),
      );
    return Response.json({ deleted: true });
  } catch {
    return Response.json(
      { error: "Unable to delete address" },
      { status: 500 },
    );
  }
}
