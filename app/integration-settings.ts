import { env } from "cloudflare:workers";

type RuntimeValues = Record<string, string | undefined>;

export type IntegrationProvider =
  | "shiprocket"
  | "amazon"
  | "email"
  | "whatsapp"
  | "google_reviews"
  | "google_login"
  | "razorpay"
  | "phonepe";

export type IntegrationField = {
  key: string;
  label: string;
  type: "text" | "email" | "password" | "select";
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: Array<{ value: string; label: string }>;
  env: string;
};

export type IntegrationDefinition = {
  provider: IntegrationProvider;
  group: string;
  name: string;
  note: string;
  testable: boolean;
  fields: IntegrationField[];
};

export const integrationDefinitions: IntegrationDefinition[] = [
  {
    provider: "shiprocket",
    group: "SHIPPING",
    name: "Shiprocket",
    note: "Create shipments, assign AWBs, labels and tracking from the order desk.",
    testable: true,
    fields: [
      { key: "email", label: "Account email", type: "email", required: true, env: "SHIPROCKET_EMAIL" },
      { key: "password", label: "Password", type: "password", required: true, env: "SHIPROCKET_PASSWORD" },
      { key: "pickupLocation", label: "Pickup location name", type: "text", required: true, env: "SHIPROCKET_PICKUP_LOCATION", placeholder: "Primary" },
    ],
  },
  {
    provider: "amazon",
    group: "SHIPPING",
    name: "Amazon Shipping",
    note: "Authorize Shipping V2 rates, purchases and parcel tracking.",
    testable: true,
    fields: [
      { key: "clientId", label: "LWA client ID", type: "password", required: true, env: "AMAZON_LWA_CLIENT_ID" },
      { key: "clientSecret", label: "LWA client secret", type: "password", required: true, env: "AMAZON_LWA_CLIENT_SECRET" },
      { key: "refreshToken", label: "LWA refresh token", type: "password", required: true, env: "AMAZON_LWA_REFRESH_TOKEN" },
      { key: "endpoint", label: "SP API endpoint", type: "text", env: "AMAZON_SP_API_ENDPOINT", placeholder: "https://sellingpartnerapi-eu.amazon.com" },
      { key: "businessId", label: "Shipping business ID", type: "text", env: "AMAZON_SHIPPING_BUSINESS_ID" },
      { key: "shipFromName", label: "Dispatch name", type: "text", required: true, env: "K1_SHIP_FROM_NAME" },
      { key: "shipFromAddress", label: "Dispatch address", type: "text", required: true, env: "K1_SHIP_FROM_ADDRESS" },
      { key: "shipFromCity", label: "Dispatch city", type: "text", required: true, env: "K1_SHIP_FROM_CITY" },
      { key: "shipFromState", label: "Dispatch state", type: "text", required: true, env: "K1_SHIP_FROM_STATE" },
      { key: "shipFromPin", label: "Dispatch PIN", type: "text", required: true, env: "K1_SHIP_FROM_PIN" },
      { key: "shipFromPhone", label: "Dispatch phone", type: "text", required: true, env: "K1_SHIP_FROM_PHONE" },
      { key: "shipFromEmail", label: "Dispatch email", type: "email", required: true, env: "K1_SHIP_FROM_EMAIL" },
    ],
  },
  {
    provider: "email",
    group: "MESSAGING",
    name: "Email · Resend",
    note: "Deliver login codes, transactional messages and consent-based campaigns.",
    testable: true,
    fields: [
      { key: "apiKey", label: "Resend API key", type: "password", required: true, env: "RESEND_API_KEY" },
      { key: "fromEmail", label: "From address", type: "email", required: true, env: "MARKETING_FROM_EMAIL", placeholder: "K1 Nuts <orders@example.com>" },
      { key: "authFromEmail", label: "Login code sender", type: "email", env: "K1_AUTH_FROM_EMAIL", help: "Optional. Uses the From address when left empty." },
    ],
  },
  {
    provider: "whatsapp",
    group: "MESSAGING",
    name: "WhatsApp Cloud API",
    note: "Send approved templates to customers who have opted in.",
    testable: true,
    fields: [
      { key: "accessToken", label: "Permanent access token", type: "password", required: true, env: "WHATSAPP_ACCESS_TOKEN" },
      { key: "phoneNumberId", label: "Phone number ID", type: "text", required: true, env: "WHATSAPP_PHONE_NUMBER_ID" },
      { key: "graphVersion", label: "Graph API version", type: "text", env: "WHATSAPP_GRAPH_VERSION", placeholder: "v23.0" },
    ],
  },
  {
    provider: "google_reviews",
    group: "TRUST",
    name: "Google Reviews",
    note: "Keep the storefront review carousel synchronized with your Google Business profile.",
    testable: true,
    fields: [
      { key: "apiKey", label: "Places API key", type: "password", required: true, env: "GOOGLE_PLACES_API_KEY" },
      { key: "placeId", label: "Google Place ID", type: "text", env: "GOOGLE_PLACE_ID", help: "Optional; K1 Nuts is searched automatically when blank." },
    ],
  },
  {
    provider: "google_login",
    group: "IDENTITY",
    name: "Google Sign-in",
    note: "Allow customers to create and access their K1 account with Google.",
    testable: false,
    fields: [
      { key: "clientId", label: "OAuth client ID", type: "password", required: true, env: "GOOGLE_OAUTH_CLIENT_ID" },
      { key: "clientSecret", label: "OAuth client secret", type: "password", required: true, env: "GOOGLE_OAUTH_CLIENT_SECRET" },
    ],
  },
  {
    provider: "razorpay",
    group: "PAYMENTS",
    name: "Razorpay",
    note: "Securely stage Razorpay credentials for checkout activation and webhooks.",
    testable: true,
    fields: [
      { key: "keyId", label: "Key ID", type: "password", required: true, env: "RAZORPAY_KEY_ID" },
      { key: "keySecret", label: "Key secret", type: "password", required: true, env: "RAZORPAY_KEY_SECRET" },
      { key: "webhookSecret", label: "Webhook secret", type: "password", env: "RAZORPAY_WEBHOOK_SECRET" },
    ],
  },
  {
    provider: "phonepe",
    group: "PAYMENTS",
    name: "PhonePe",
    note: "Save merchant credentials for the approved PhonePe payment environment.",
    testable: false,
    fields: [
      { key: "merchantId", label: "Merchant ID", type: "text", required: true, env: "PHONEPE_MERCHANT_ID" },
      { key: "clientId", label: "Client ID", type: "password", required: true, env: "PHONEPE_CLIENT_ID" },
      { key: "clientSecret", label: "Client secret", type: "password", required: true, env: "PHONEPE_CLIENT_SECRET" },
      { key: "environment", label: "Environment", type: "select", required: true, env: "PHONEPE_ENVIRONMENT", options: [{ value: "sandbox", label: "Sandbox" }, { value: "production", label: "Production" }] },
    ],
  },
];

const localEncryptionSecret = "k1-local-integration-secret-development-only";

function runtimeValues() {
  return env as unknown as RuntimeValues;
}

function definitionFor(provider: string) {
  return integrationDefinitions.find((item) => item.provider === provider);
}

function bytesToBase64(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64ToBytes(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function encryptionKey() {
  const values = runtimeValues();
  const secret =
    values.K1_AUTH_SECRET?.trim() ||
    values.K1_ADMIN_SESSION_SECRET?.trim() ||
    (process.env.NODE_ENV === "development" ? localEncryptionSecret : "");
  if (!secret) throw new Error("Integration encryption secret is not configured.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptConfig(config: Record<string, string>) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(),
    new TextEncoder().encode(JSON.stringify(config)),
  );
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
}

async function decryptConfig(value: string) {
  try {
    const [version, iv, ciphertext] = value.split(".");
    if (version !== "v1" || !iv || !ciphertext) return {};
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(iv) },
      await encryptionKey(),
      base64ToBytes(ciphertext),
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as Record<string, string>;
  } catch {
    return {};
  }
}

async function storedRow(provider: IntegrationProvider) {
  return env.DB.prepare(
    `SELECT config_encrypted AS configEncrypted, enabled,
      last_test_status AS lastTestStatus, last_test_message AS lastTestMessage,
      last_tested_at AS lastTestedAt, updated_at AS updatedAt
     FROM integration_settings WHERE provider = ? LIMIT 1`,
  )
    .bind(provider)
    .first<{
      configEncrypted: string;
      enabled: number;
      lastTestStatus: string | null;
      lastTestMessage: string | null;
      lastTestedAt: number | null;
      updatedAt: number;
    }>();
}

export async function getIntegrationConfig(provider: IntegrationProvider) {
  const definition = definitionFor(provider);
  if (!definition) return {};
  const row = await storedRow(provider);
  const stored = row?.enabled ? await decryptConfig(row.configEncrypted) : {};
  const values = runtimeValues();
  return Object.fromEntries(
    definition.fields.map((field) => [
      field.key,
      stored[field.key]?.trim() || values[field.env]?.trim() || "",
    ]),
  );
}

function mask(value: string) {
  if (!value) return "";
  const visible = value.length > 6 ? value.slice(-4) : value.slice(-2);
  return `••••${visible}`;
}

export async function getIntegrationStatuses() {
  const rows = await env.DB.prepare(
    `SELECT provider, config_encrypted AS configEncrypted, enabled,
      last_test_status AS lastTestStatus, last_test_message AS lastTestMessage,
      last_tested_at AS lastTestedAt, updated_at AS updatedAt
     FROM integration_settings`,
  ).all<{
    provider: IntegrationProvider;
    configEncrypted: string;
    enabled: number;
    lastTestStatus: string | null;
    lastTestMessage: string | null;
    lastTestedAt: number | null;
    updatedAt: number;
  }>();
  const rowByProvider = new Map(rows.results.map((row) => [row.provider, row]));
  const runtime = runtimeValues();
  return Promise.all(
    integrationDefinitions.map(async (definition) => {
      const row = rowByProvider.get(definition.provider);
      const stored = row?.enabled ? await decryptConfig(row.configEncrypted) : {};
      const config = Object.fromEntries(
        definition.fields.map((field) => [
          field.key,
          stored[field.key]?.trim() || runtime[field.env]?.trim() || "",
        ]),
      );
      const configured = definition.fields
        .filter((field) => field.required)
        .every((field) => Boolean(config[field.key]));
      const publicValues = Object.fromEntries(
        definition.fields
          .filter((field) => field.type !== "password")
          .map((field) => [field.key, stored[field.key] || runtime[field.env]?.trim() || ""]),
      );
      const secretHints = Object.fromEntries(
        definition.fields
          .filter((field) => field.type === "password")
          .map((field) => [field.key, mask(config[field.key] || "")]),
      );
      return {
        ...definition,
        configured,
        source: row?.enabled ? "admin" : configured ? "environment" : "none",
        values: publicValues,
        secretHints,
        lastTestStatus: row?.lastTestStatus || null,
        lastTestMessage: row?.lastTestMessage || null,
        lastTestedAt: row?.lastTestedAt || null,
        updatedAt: row?.updatedAt || null,
      };
    }),
  );
}

export async function saveIntegrationConfig(
  provider: IntegrationProvider,
  input: Record<string, unknown>,
) {
  const definition = definitionFor(provider);
  if (!definition) throw new Error("Unsupported integration provider.");
  const row = await storedRow(provider);
  const existing = row ? await decryptConfig(row.configEncrypted) : {};
  const next: Record<string, string> = {};
  for (const field of definition.fields) {
    const submitted = typeof input[field.key] === "string" ? String(input[field.key]).trim().slice(0, 2000) : "";
    if (field.type === "password" && !submitted) next[field.key] = existing[field.key] || "";
    else next[field.key] = submitted;
  }
  const now = Date.now();
  const encrypted = await encryptConfig(next);
  await env.DB.prepare(
    `INSERT INTO integration_settings
      (provider, config_encrypted, enabled, created_at, updated_at)
     VALUES (?, ?, 1, ?, ?)
     ON CONFLICT(provider) DO UPDATE SET
      config_encrypted = excluded.config_encrypted,
      enabled = 1,
      last_test_status = NULL,
      last_test_message = NULL,
      last_tested_at = NULL,
      updated_at = excluded.updated_at`,
  )
    .bind(provider, encrypted, now, now)
    .run();
  return getIntegrationStatuses();
}

export async function recordIntegrationTest(
  provider: IntegrationProvider,
  status: "passed" | "failed",
  message: string,
) {
  await env.DB.prepare(
    `UPDATE integration_settings SET last_test_status = ?, last_test_message = ?,
      last_tested_at = ?, updated_at = ? WHERE provider = ?`,
  )
    .bind(status, message.slice(0, 300), Date.now(), Date.now(), provider)
    .run();
}

export async function getIntegrationFlags() {
  const statuses = await getIntegrationStatuses();
  return Object.fromEntries(statuses.map((status) => [status.provider, status.configured])) as Record<IntegrationProvider, boolean>;
}
