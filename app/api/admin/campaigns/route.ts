import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  campaignDeliveries,
  customerProfiles,
  marketingCampaigns,
} from "../../../../db/schema";
import { getAdminUser } from "../../../admin-auth";
import {
  type CampaignChannel,
  getCampaignLimit,
  getMarketingConfiguration,
  sendCampaign,
} from "../../../marketing";

export const dynamic = "force-dynamic";

async function audienceFor(channel: CampaignChannel) {
  const db = getDb();
  const rows = await db
    .select({
      userId: customerProfiles.userId,
      email: customerProfiles.email,
      displayName: customerProfiles.displayName,
      phone: customerProfiles.phone,
    })
    .from(customerProfiles)
    .where(
      channel === "email"
        ? eq(customerProfiles.marketingOptIn, true)
        : eq(customerProfiles.whatsappMarketingOptIn, true),
    )
    .limit(getCampaignLimit());
  return rows.filter((recipient) =>
    channel === "email"
      ? Boolean(recipient.email)
      : Boolean(recipient.phone?.replace(/\D/g, "")),
  );
}

export async function GET() {
  const user = await getAdminUser();
  if (!user)
    return Response.json({ error: "Authentication required." }, { status: 401 });
  const db = getDb();
  const [campaigns, emailAudience, whatsappAudience] = await Promise.all([
    db
      .select()
      .from(marketingCampaigns)
      .orderBy(desc(marketingCampaigns.createdAt))
      .limit(30),
    audienceFor("email"),
    audienceFor("whatsapp"),
  ]);
  return Response.json(
    {
      campaigns,
      audience: {
        email: emailAudience.length,
        whatsapp: whatsappAudience.length,
      },
      configuration: await getMarketingConfiguration(),
      campaignLimit: getCampaignLimit(),
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user)
    return Response.json({ error: "Authentication required." }, { status: 401 });

  const body = (await request.json()) as {
    campaignId?: number;
    name?: string;
    channel?: CampaignChannel;
    subject?: string;
    message?: string;
    templateName?: string;
    templateLanguage?: string;
    sendNow?: boolean;
  };
  const db = getDb();
  const now = Date.now();
  let campaign: typeof marketingCampaigns.$inferSelect | undefined;

  if (body.campaignId) {
    [campaign] = await db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, Number(body.campaignId)))
      .limit(1);
    if (!campaign)
      return Response.json({ error: "Campaign not found." }, { status: 404 });
    if (!["draft", "failed"].includes(campaign.status)) {
      return Response.json(
        { error: "Only draft or failed campaigns can be sent." },
        { status: 409 },
      );
    }
  } else {
    const name = body.name?.trim().slice(0, 100);
    const channel = body.channel;
    const message = body.message?.trim().slice(0, 1800);
    const subject = body.subject?.trim().slice(0, 160) || null;
    const templateName = body.templateName?.trim().slice(0, 120) || null;
    const templateLanguage =
      body.templateLanguage?.trim().slice(0, 20) || "en_US";
    if (!name || !message || !["email", "whatsapp"].includes(channel || "")) {
      return Response.json(
        { error: "Campaign name, channel and message are required." },
        { status: 400 },
      );
    }
    if (channel === "email" && !subject) {
      return Response.json(
        { error: "Email campaigns require a subject." },
        { status: 400 },
      );
    }
    if (channel === "whatsapp" && !templateName) {
      return Response.json(
        { error: "WhatsApp campaigns require an approved template name." },
        { status: 400 },
      );
    }
    const recipients = await audienceFor(channel as CampaignChannel);
    [campaign] = await db
      .insert(marketingCampaigns)
      .values({
        name,
        channel: channel as string,
        subject,
        message,
        templateName,
        templateLanguage,
        audienceCount: recipients.length,
        createdBy: user.userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  }

  if (!campaign)
    return Response.json({ error: "Unable to create campaign." }, { status: 500 });
  if (!body.sendNow) return Response.json({ campaign }, { status: 201 });

  const channel = campaign.channel as CampaignChannel;
  const configuration = await getMarketingConfiguration();
  const providerReady =
    channel === "email" ? configuration.email : configuration.whatsapp;
  if (!providerReady) {
    return Response.json(
      {
        campaign,
        savedAsDraft: true,
        error: `${channel === "email" ? "Email" : "WhatsApp"} provider credentials are required before sending.`,
      },
      { status: 202 },
    );
  }

  const recipients = await audienceFor(channel);
  await db
    .update(marketingCampaigns)
    .set({
      status: "sending",
      audienceCount: recipients.length,
      startedAt: now,
      updatedAt: now,
    })
    .where(eq(marketingCampaigns.id, campaign.id));

  if (!recipients.length) {
    await db
      .update(marketingCampaigns)
      .set({ status: "completed", completedAt: now, updatedAt: now })
      .where(eq(marketingCampaigns.id, campaign.id));
    return Response.json({ campaign: { ...campaign, status: "completed" } });
  }

  try {
    const results = await sendCampaign({
      channel,
      recipients,
      subject: campaign.subject || undefined,
      message: campaign.message,
      templateName: campaign.templateName || undefined,
      templateLanguage: campaign.templateLanguage || undefined,
    });
    const completedAt = Date.now();
    await db.insert(campaignDeliveries).values(
      results.map((result) => ({
        campaignId: campaign!.id,
        userId: result.userId,
        channel,
        status: result.status,
        providerMessageId: result.providerMessageId || null,
        error: result.error || null,
        createdAt: completedAt,
        updatedAt: completedAt,
      })),
    );
    const sentCount = results.filter((result) => result.status === "sent").length;
    const failedCount = results.length - sentCount;
    const status = failedCount === results.length ? "failed" : "completed";
    await db
      .update(marketingCampaigns)
      .set({
        status,
        sentCount,
        failedCount,
        completedAt,
        updatedAt: completedAt,
      })
      .where(eq(marketingCampaigns.id, campaign.id));
    return Response.json({
      campaign: { ...campaign, status, sentCount, failedCount },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 300) : "Campaign send failed.";
    await db
      .update(marketingCampaigns)
      .set({
        status: "failed",
        failedCount: recipients.length,
        completedAt: Date.now(),
        updatedAt: Date.now(),
      })
      .where(eq(marketingCampaigns.id, campaign.id));
    return Response.json({ error: message }, { status: 502 });
  }
}
