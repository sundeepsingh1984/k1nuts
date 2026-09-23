import { getIntegrationConfig, getIntegrationFlags } from "./integration-settings";

export type ShippingAddress = {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode?: string;
};

export type ShippingItem = {
  sku: string;
  name: string;
  quantity: number;
  pricePaise: number;
  weightGrams: number;
};

export type ShippingOrder = {
  orderNumber: string;
  placedAt: number;
  paymentMethod: "Prepaid" | "COD";
  subtotalPaise: number;
  address: ShippingAddress;
  items: ShippingItem[];
};

function required(config: Record<string, string>, key: string, label: string) {
  const value = config[key]?.trim();
  if (!value) throw new Error(`${label} is not configured.`);
  return value;
}

export async function getShippingConfiguration() {
  const flags = await getIntegrationFlags();
  return {
    shiprocket: flags.shiprocket,
    amazon: flags.amazon,
  };
}

let shiprocketToken: { value: string; expiresAt: number; fingerprint: string } | null = null;

async function getShiprocketToken() {
  const config = await getIntegrationConfig("shiprocket");
  const fingerprint = `${config.email}:${config.password}`;
  if (
    shiprocketToken &&
    shiprocketToken.expiresAt > Date.now() &&
    shiprocketToken.fingerprint === fingerprint
  ) {
    return shiprocketToken.value;
  }
  const response = await fetch(
    "https://apiv2.shiprocket.in/v1/external/auth/login",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: required(config, "email", "Shiprocket email"),
        password: required(config, "password", "Shiprocket password"),
      }),
    },
  );
  const result = (await response.json()) as {
    token?: string;
    message?: string;
  };
  if (!response.ok || !result.token) {
    throw new Error(result.message || "Shiprocket authentication failed.");
  }
  shiprocketToken = {
    value: result.token,
    expiresAt: Date.now() + 8 * 24 * 60 * 60 * 1000,
    fingerprint,
  };
  return result.token;
}

async function shiprocketRequest(path: string, init?: RequestInit) {
  const token = await getShiprocketToken();
  const response = await fetch(
    `https://apiv2.shiprocket.in/v1/external${path}`,
    {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        ...init?.headers,
      },
    },
  );
  const result = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      (result.message as string) ||
        `Shiprocket request failed (${response.status}).`,
    );
  }
  return result;
}

export async function testShiprocketConnection() {
  await getShiprocketToken();
  return { connected: true };
}

export async function createShiprocketShipment(order: ShippingOrder) {
  const config = await getIntegrationConfig("shiprocket");
  const weightKg = Math.max(
    0.25,
    order.items.reduce(
      (sum, item) => sum + item.weightGrams * item.quantity,
      0,
    ) / 1000,
  );
  const created = await shiprocketRequest("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify({
      order_id: order.orderNumber,
      order_date: new Date(order.placedAt)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      pickup_location: required(config, "pickupLocation", "Shiprocket pickup location"),
      billing_customer_name: order.address.name,
      billing_address: order.address.line1,
      billing_address_2: order.address.line2 || "",
      billing_city: order.address.city,
      billing_pincode: Number(order.address.postalCode),
      billing_state: order.address.state,
      billing_country: "India",
      billing_email: order.address.email,
      billing_phone: order.address.phone.replace(/\D/g, "").slice(-10),
      shipping_is_billing: true,
      order_items: order.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        units: item.quantity,
        selling_price: item.pricePaise / 100,
      })),
      payment_method: order.paymentMethod,
      sub_total: order.subtotalPaise / 100,
      length: 24,
      breadth: 18,
      height: Math.max(8, Math.ceil(weightKg * 8)),
      weight: weightKg,
    }),
  });
  const shipmentId = String(created.shipment_id ?? "");
  if (!shipmentId) throw new Error("Shiprocket did not return a shipment ID.");
  const assigned = await shiprocketRequest("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: Number(shipmentId) }),
  });
  const responseData = (assigned.response as Record<string, unknown>)?.data as
    Record<string, unknown> | undefined;
  const awb = String(responseData?.awb_code ?? "");
  let labelUrl: string | null = null;
  if (awb) {
    const label = await shiprocketRequest("/courier/generate/label", {
      method: "POST",
      body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
    });
    labelUrl = typeof label.label_url === "string" ? label.label_url : null;
  }
  return {
    externalOrderId: String(created.order_id ?? order.orderNumber),
    externalShipmentId: shipmentId,
    trackingNumber: awb,
    carrier: String(responseData?.courier_name ?? "Shiprocket"),
    labelUrl,
    trackingUrl: awb ? `https://shiprocket.co/tracking/${awb}` : null,
  };
}

export async function trackShiprocketShipment(awb: string) {
  return shiprocketRequest(`/courier/track/awb/${encodeURIComponent(awb)}`);
}

let amazonToken: { value: string; expiresAt: number; fingerprint: string } | null = null;

async function getAmazonAccessToken() {
  const config = await getIntegrationConfig("amazon");
  const fingerprint = `${config.clientId}:${config.clientSecret}:${config.refreshToken}`;
  if (
    amazonToken &&
    amazonToken.expiresAt > Date.now() &&
    amazonToken.fingerprint === fingerprint
  )
    return amazonToken.value;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: required(config, "refreshToken", "Amazon refresh token"),
    client_id: required(config, "clientId", "Amazon client ID"),
    client_secret: required(config, "clientSecret", "Amazon client secret"),
  });
  const response = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const result = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!response.ok || !result.access_token) {
    throw new Error(result.error_description || "Amazon authorization failed.");
  }
  amazonToken = {
    value: result.access_token,
    expiresAt:
      Date.now() + Math.max(300, (result.expires_in ?? 3600) - 120) * 1000,
    fingerprint,
  };
  return result.access_token;
}

async function amazonRequest(path: string, init?: RequestInit) {
  const accessToken = await getAmazonAccessToken();
  const config = await getIntegrationConfig("amazon");
  const endpoint =
    config.endpoint?.replace(/\/$/, "") ||
    "https://sellingpartnerapi-eu.amazon.com";
  const businessId = config.businessId?.trim();
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-amz-access-token": accessToken,
      "x-amz-date": new Date().toISOString().replace(/[:-]|\.\d{3}/g, ""),
      "user-agent": "K1NutsCommerce/1.0 (Language=TypeScript)",
      ...(businessId ? { "x-amzn-shipping-business-id": businessId } : {}),
      ...init?.headers,
    },
  });
  const result = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const errors = result.errors as Array<{ message?: string }> | undefined;
    throw new Error(
      errors?.[0]?.message ||
        `Amazon Shipping request failed (${response.status}).`,
    );
  }
  return result;
}

function amazonAddress(address: ShippingAddress) {
  return {
    name: address.name,
    addressLine1: address.line1,
    addressLine2: address.line2 || undefined,
    city: address.city,
    stateOrRegion: address.state,
    postalCode: address.postalCode,
    countryCode: address.countryCode || "IN",
    phoneNumber: address.phone,
    email: address.email,
  };
}

function amazonShipFrom(config: Record<string, string>) {
  return {
    name: required(config, "shipFromName", "Dispatch name"),
    addressLine1: required(config, "shipFromAddress", "Dispatch address"),
    city: required(config, "shipFromCity", "Dispatch city"),
    stateOrRegion: required(config, "shipFromState", "Dispatch state"),
    postalCode: required(config, "shipFromPin", "Dispatch PIN"),
    countryCode: "IN",
    phoneNumber: required(config, "shipFromPhone", "Dispatch phone"),
    email: required(config, "shipFromEmail", "Dispatch email"),
  };
}

export async function testAmazonConnection() {
  await getAmazonAccessToken();
  return { connected: true };
}

export async function getAmazonShippingRates(order: ShippingOrder) {
  const config = await getIntegrationConfig("amazon");
  const totalWeight = order.items.reduce(
    (sum, item) => sum + item.weightGrams * item.quantity,
    0,
  );
  return amazonRequest("/shipping/v2/shipments/rates", {
    method: "POST",
    body: JSON.stringify({
      shipTo: amazonAddress(order.address),
      shipFrom: amazonShipFrom(config),
      packages: [
        {
          dimensions: {
            unit: "CENTIMETER",
            length: 24,
            width: 18,
            height: Math.max(8, Math.ceil(totalWeight / 125)),
          },
          weight: { unit: "GRAM", value: Math.max(250, totalWeight) },
          insuredValue: { value: order.subtotalPaise / 100, unit: "INR" },
          isHazmat: false,
          packageClientReferenceId: order.orderNumber,
          items: order.items.map((item) => ({
            itemValue: { value: item.pricePaise / 100, unit: "INR" },
            description: item.name,
            itemIdentifier: item.sku,
            quantity: item.quantity,
            weight: { unit: "GRAM", value: item.weightGrams },
            isHazmat: false,
          })),
        },
      ],
      channelDetails: { channelType: "EXTERNAL" },
    }),
  });
}

export async function purchaseAmazonShipment(input: {
  requestToken: string;
  rateId: string;
  documentSpecification: Record<string, unknown>;
}) {
  return amazonRequest("/shipping/v2/shipments", {
    method: "POST",
    body: JSON.stringify({
      requestToken: input.requestToken,
      rateId: input.rateId,
      requestedDocumentSpecification: input.documentSpecification,
    }),
  });
}

export async function trackAmazonShipment(
  trackingId: string,
  carrierId: string,
) {
  const query = new URLSearchParams({ trackingId, carrierId });
  return amazonRequest(`/shipping/v2/tracking?${query.toString()}`);
}
