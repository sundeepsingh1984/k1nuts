import { getAdminUser } from "../../../admin-auth";
import {
  getIntegrationConfig,
  getIntegrationStatuses,
  integrationDefinitions,
  type IntegrationProvider,
  recordIntegrationTest,
  saveIntegrationConfig,
} from "../../../integration-settings";
import { testAmazonConnection, testShiprocketConnection } from "../../../shipping";

export const dynamic = "force-dynamic";

function isProvider(value: unknown): value is IntegrationProvider {
  return integrationDefinitions.some((definition) => definition.provider === value);
}

async function requireAdmin() {
  return Boolean(await getAdminUser());
}

export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  return Response.json(
    { providers: await getIntegrationStatuses() },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    provider?: unknown;
    values?: Record<string, unknown>;
  };
  if (!isProvider(body.provider)) {
    return Response.json({ error: "Choose a supported provider." }, { status: 400 });
  }
  try {
    const providers = await saveIntegrationConfig(body.provider, body.values || {});
    return Response.json({ providers });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save integration." },
      { status: 400 },
    );
  }
}

async function testProvider(provider: IntegrationProvider) {
  if (provider === "shiprocket") {
    await testShiprocketConnection();
    return "Shiprocket authentication succeeded.";
  }
  if (provider === "amazon") {
    await testAmazonConnection();
    return "Amazon LWA authorization succeeded.";
  }
  const config = await getIntegrationConfig(provider);
  if (provider === "email") {
    const response = await fetch("https://api.resend.com/domains", {
      headers: { authorization: `Bearer ${config.apiKey}` },
    });
    if (!response.ok) throw new Error(`Resend rejected the API key (${response.status}).`);
    return "Resend accepted the API key.";
  }
  if (provider === "whatsapp") {
    const version = config.graphVersion || "v23.0";
    const response = await fetch(
      `https://graph.facebook.com/${version}/${encodeURIComponent(config.phoneNumberId || "")}?fields=display_phone_number,verified_name`,
      { headers: { authorization: `Bearer ${config.accessToken}` } },
    );
    if (!response.ok) throw new Error(`WhatsApp rejected the credentials (${response.status}).`);
    return "WhatsApp phone number access succeeded.";
  }
  if (provider === "google_reviews") {
    const response = config.placeId
      ? await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(config.placeId)}`, {
          headers: {
            "X-Goog-Api-Key": config.apiKey,
            "X-Goog-FieldMask": "id,displayName,rating,userRatingCount",
          },
        })
      : await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": config.apiKey,
            "X-Goog-FieldMask": "places.id,places.displayName",
          },
          body: JSON.stringify({ textQuery: "K1 Nuts, Srinagar, India" }),
        });
    if (!response.ok) throw new Error(`Google Places rejected the credentials (${response.status}).`);
    return "Google Places connection succeeded.";
  }
  if (provider === "razorpay") {
    const credentials = btoa(`${config.keyId}:${config.keySecret}`);
    const response = await fetch("https://api.razorpay.com/v1/payments?count=1", {
      headers: { authorization: `Basic ${credentials}` },
    });
    if (!response.ok) throw new Error(`Razorpay rejected the credentials (${response.status}).`);
    return "Razorpay authentication succeeded.";
  }
  throw new Error("This provider is saved here but requires activation in its own console.");
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { provider?: unknown };
  if (!isProvider(body.provider)) {
    return Response.json({ error: "Choose a supported provider." }, { status: 400 });
  }
  const definition = integrationDefinitions.find((item) => item.provider === body.provider);
  if (!definition?.testable) {
    return Response.json(
      { error: "Save the credentials, then complete activation in the provider console." },
      { status: 409 },
    );
  }
  const status = (await getIntegrationStatuses()).find((item) => item.provider === body.provider);
  if (!status?.configured) {
    return Response.json({ error: "Complete the required fields before testing." }, { status: 400 });
  }
  try {
    const message = await testProvider(body.provider);
    await recordIntegrationTest(body.provider, "passed", message);
    return Response.json({ message, providers: await getIntegrationStatuses() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection test failed.";
    await recordIntegrationTest(body.provider, "failed", message);
    return Response.json(
      { error: message, providers: await getIntegrationStatuses() },
      { status: 502 },
    );
  }
}
