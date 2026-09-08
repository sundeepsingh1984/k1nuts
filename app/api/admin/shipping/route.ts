import { and, desc, eq } from "drizzle-orm";
import { getAdminUser } from "../../../admin-auth";
import { getDb } from "../../../../db";
import {
  customerAddresses,
  customerOrders,
  customerProfiles,
  orderItems,
  orderShipments,
} from "../../../../db/schema";
import {
  createShiprocketShipment,
  getAmazonShippingRates,
  purchaseAmazonShipment,
  testAmazonConnection,
  testShiprocketConnection,
  trackAmazonShipment,
  trackShiprocketShipment,
  type ShippingOrder,
} from "../../../shipping";

function grams(label: string) {
  if (/kg/i.test(label)) return Math.round(Number.parseFloat(label) * 1000);
  if (/l$/i.test(label)) return Math.round(Number.parseFloat(label) * 1000);
  return Math.round(Number.parseFloat(label) || 250);
}

async function loadShippingOrder(orderId: number): Promise<ShippingOrder> {
  const db = getDb();
  const [order] = await db
    .select()
    .from(customerOrders)
    .where(eq(customerOrders.id, orderId));
  if (!order) throw new Error("Order not found.");
  const addresses = await db
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.userId, order.userId));
  const address =
    addresses.find((item) => item.id === order.shippingAddressId) ??
    addresses.find((item) => item.isDefault) ??
    addresses[0];
  if (!address) throw new Error("This order has no delivery address.");
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  if (!items.length) throw new Error("This order has no items.");
  const [profile] = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, order.userId));
  return {
    orderNumber: order.orderNumber,
    placedAt: order.placedAt,
    paymentMethod: order.paymentStatus === "paid" ? "Prepaid" : "COD",
    subtotalPaise: order.totalPaise,
    address: {
      name: address.recipientName,
      phone: address.phone,
      email: profile?.email || "orders@k1nuts.com",
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      countryCode: "IN",
    },
    items: items.map((item) => ({
      sku: item.sku || `K1-${item.productSlug.toUpperCase()}`,
      name: `${item.productName} ${item.variantLabel}`,
      quantity: item.quantity,
      pricePaise: item.unitPricePaise,
      weightGrams: grams(item.variantLabel),
    })),
  };
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user)
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  const action = String(body.action ?? "");
  try {
    if (action === "test_shiprocket")
      return Response.json(await testShiprocketConnection());
    if (action === "test_amazon")
      return Response.json(await testAmazonConnection());

    const orderId = Number(body.orderId);
    if (!Number.isInteger(orderId) || orderId < 1) {
      return Response.json(
        { error: "A valid order is required." },
        { status: 400 },
      );
    }
    const order = await loadShippingOrder(orderId);
    const db = getDb();

    if (action === "shiprocket_create") {
      const shipment = await createShiprocketShipment(order);
      const now = Date.now();
      await db
        .insert(orderShipments)
        .values({
          orderId,
          provider: "shiprocket",
          ...shipment,
          status: shipment.trackingNumber ? "assigned" : "created",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [orderShipments.orderId, orderShipments.provider],
          set: { ...shipment, updatedAt: now },
        });
      await db
        .update(customerOrders)
        .set({
          status: shipment.trackingNumber ? "shipped" : "packed",
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          trackingUrl: shipment.trackingUrl,
          updatedAt: now,
        })
        .where(eq(customerOrders.id, orderId));
      return Response.json({ shipment });
    }

    if (action === "amazon_rates") {
      return Response.json(await getAmazonShippingRates(order));
    }

    if (action === "amazon_create") {
      const rateResult = await getAmazonShippingRates(order);
      const payload = (rateResult.payload ?? rateResult) as Record<
        string,
        unknown
      >;
      const rates = (
        (payload.rates ?? []) as Array<Record<string, unknown>>
      ).sort((left, right) => {
        const leftCharge = Number(
          (left.totalCharge as Record<string, unknown> | undefined)?.value ?? 0,
        );
        const rightCharge = Number(
          (right.totalCharge as Record<string, unknown> | undefined)?.value ??
            0,
        );
        return leftCharge - rightCharge;
      });
      const rate = rates[0];
      const requestToken = String(payload.requestToken ?? "");
      const rateId = String(rate?.rateId ?? "");
      if (!rate || !requestToken || !rateId) {
        throw new Error(
          "Amazon Shipping returned no eligible rate for this order.",
        );
      }
      const specifications = (rate.supportedDocumentSpecifications ??
        []) as Array<Record<string, unknown>>;
      const documentSpecification = specifications[0] ?? {
        format: "PDF",
        size: { width: 4, length: 6, unit: "INCH" },
        pageLayout: "DEFAULT",
        needFileJoining: false,
        requestedDocumentTypes: ["LABEL"],
      };
      const purchased = await purchaseAmazonShipment({
        requestToken,
        rateId,
        documentSpecification,
      });
      const purchasePayload = (purchased.payload ?? purchased) as Record<
        string,
        unknown
      >;
      const details = (purchasePayload.packageDocumentDetails ?? []) as Array<
        Record<string, unknown>
      >;
      const carrier = (purchasePayload.carrier ?? {}) as Record<
        string,
        unknown
      >;
      const shipmentId = String(purchasePayload.shipmentId ?? "");
      const trackingNumber = String(details[0]?.trackingId ?? "");
      const carrierName = String(carrier.carrierName ?? "Amazon Shipping");
      const carrierId = String(carrier.carrierId ?? "");
      if (!shipmentId) throw new Error("Amazon did not return a shipment ID.");
      const now = Date.now();
      await db
        .insert(orderShipments)
        .values({
          orderId,
          provider: "amazon",
          externalOrderId: carrierId,
          externalShipmentId: shipmentId,
          carrier: carrierName,
          trackingNumber,
          status: trackingNumber ? "purchased" : "created",
          trackingUrl: null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [orderShipments.orderId, orderShipments.provider],
          set: {
            externalOrderId: carrierId,
            externalShipmentId: shipmentId,
            carrier: carrierName,
            trackingNumber,
            status: trackingNumber ? "purchased" : "created",
            updatedAt: now,
          },
        });
      await db
        .update(customerOrders)
        .set({
          status: trackingNumber ? "shipped" : "packed",
          carrier: carrierName,
          trackingNumber,
          updatedAt: now,
        })
        .where(eq(customerOrders.id, orderId));
      return Response.json({
        shipmentId,
        trackingNumber,
        carrier: carrierName,
      });
    }

    if (action === "amazon_purchase") {
      const result = await purchaseAmazonShipment({
        requestToken: String(body.requestToken ?? ""),
        rateId: String(body.rateId ?? ""),
        documentSpecification: (body.documentSpecification ?? {}) as Record<
          string,
          unknown
        >,
      });
      return Response.json(result);
    }

    if (action === "sync_tracking") {
      const [shipment] = await db
        .select()
        .from(orderShipments)
        .where(eq(orderShipments.orderId, orderId))
        .orderBy(desc(orderShipments.createdAt));
      if (!shipment?.trackingNumber)
        throw new Error("Tracking is not assigned yet.");
      const tracking =
        shipment.provider === "amazon"
          ? await trackAmazonShipment(
              shipment.trackingNumber,
              shipment.externalOrderId || shipment.carrier || "AMZN_IN",
            )
          : await trackShiprocketShipment(shipment.trackingNumber);
      await db
        .update(orderShipments)
        .set({ updatedAt: Date.now() })
        .where(
          and(
            eq(orderShipments.orderId, orderId),
            eq(orderShipments.provider, shipment.provider),
          ),
        );
      return Response.json({ tracking });
    }

    return Response.json(
      { error: "Unknown shipping action." },
      { status: 400 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Shipping request failed.",
      },
      { status: 502 },
    );
  }
}
