import { env } from "cloudflare:workers";
import { getIntegrationConfig, getIntegrationFlags } from "./integration-settings";

export type CampaignChannel = "email" | "whatsapp";

type Recipient = {
  userId: string;
  email: string;
  displayName: string;
  phone: string | null;
};

export type DeliveryResult = {
  userId: string;
  status: "sent" | "failed";
  providerMessageId?: string;
  error?: string;
};

function runtimeEnv() {
  return env as unknown as Record<string, string | undefined>;
}

export async function getMarketingConfiguration() {
  const variables = runtimeEnv();
  const flags = await getIntegrationFlags();
  return {
    email: flags.email,
    whatsapp: flags.whatsapp,
    identity: {
      chatgpt: true,
      firebaseProjectConfigured: Boolean(
        variables.NEXT_PUBLIC_FIREBASE_API_KEY &&
          variables.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
          variables.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      ),
      externalLoginActive: false,
    },
  };
}

export function getCampaignLimit() {
  const configured = Number(runtimeEnv().MARKETING_BATCH_LIMIT || 250);
  return Math.min(500, Math.max(1, Number.isFinite(configured) ? configured : 250));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function campaignHtml(message: string, displayName: string) {
  const siteUrl =
    runtimeEnv().NEXT_PUBLIC_SITE_URL ||
    "https://nourish-and-nut.sales-k1nuts.chatgpt.site";
  return `<!doctype html><html><body style="margin:0;background:#f7f0e5;color:#2d160c;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;padding:36px 24px"><p style="font-size:12px;letter-spacing:2px;color:#9a6324">K1 NUT'S · DELICACY FROM THE HIMALAYAS</p><h1 style="font-family:Georgia,serif;font-size:34px">A note for ${escapeHtml(displayName || "you")}</h1><p style="font-size:17px;line-height:1.7;white-space:pre-line">${escapeHtml(message)}</p><p style="margin-top:28px"><a href="${siteUrl}/#categories" style="display:inline-block;background:#2d160c;color:#fff8ed;padding:14px 22px;text-decoration:none">SHOP K1 NUT'S</a></p><hr style="border:0;border-top:1px solid #d8c5aa;margin:34px 0"><p style="font-size:12px;line-height:1.6;color:#765e4e">You received this because you opted in to K1 email offers. You can change your preference in <a href="${siteUrl}/account">My K1</a>.</p></div></body></html>`;
}

async function sendEmailCampaign(
  recipients: Recipient[],
  subject: string,
  message: string,
): Promise<DeliveryResult[]> {
  const config = await getIntegrationConfig("email");
  if (!config.apiKey || !config.fromEmail) {
    throw new Error("Email provider credentials are not configured.");
  }
  const results: DeliveryResult[] = [];
  for (let offset = 0; offset < recipients.length; offset += 100) {
    const batch = recipients.slice(offset, offset + 100);
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(
        batch.map((recipient) => ({
          from: config.fromEmail,
          to: [recipient.email],
          subject,
          html: campaignHtml(message, recipient.displayName),
          text: `${message}\n\nManage your K1 marketing preference in My K1.`,
          tags: [{ name: "campaign", value: "k1_marketing" }],
        })),
      ),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      data?: Array<{ id?: string }>;
      message?: string;
      error?: { message?: string };
    };
    if (!response.ok) {
      const error = (payload.error?.message || payload.message || "Email delivery failed").slice(0, 300);
      results.push(
        ...batch.map((recipient) => ({
          userId: recipient.userId,
          status: "failed" as const,
          error,
        })),
      );
      continue;
    }
    results.push(
      ...batch.map((recipient, index) => ({
        userId: recipient.userId,
        status: "sent" as const,
        providerMessageId: payload.data?.[index]?.id,
      })),
    );
  }
  return results;
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

async function sendWhatsAppOne(
  recipient: Recipient,
  templateName: string,
  templateLanguage: string,
  message: string,
  config: Record<string, string>,
): Promise<DeliveryResult> {
  const version = config.graphVersion || "v23.0";
  const response = await fetch(
    `https://graph.facebook.com/${version}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhone(recipient.phone || ""),
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: message.slice(0, 900) }],
            },
          ],
        },
      }),
    },
  );
  const payload = (await response.json().catch(() => ({}))) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string };
  };
  return response.ok
    ? {
        userId: recipient.userId,
        status: "sent",
        providerMessageId: payload.messages?.[0]?.id,
      }
    : {
        userId: recipient.userId,
        status: "failed",
        error: (payload.error?.message || "WhatsApp delivery failed").slice(0, 300),
      };
}

async function sendWhatsAppCampaign(
  recipients: Recipient[],
  templateName: string,
  templateLanguage: string,
  message: string,
) {
  const config = await getIntegrationConfig("whatsapp");
  if (!config.accessToken || !config.phoneNumberId) {
    throw new Error("WhatsApp provider credentials are not configured.");
  }
  const results: DeliveryResult[] = [];
  for (let offset = 0; offset < recipients.length; offset += 5) {
    results.push(
      ...(await Promise.all(
        recipients
          .slice(offset, offset + 5)
          .map((recipient) =>
            sendWhatsAppOne(
              recipient,
              templateName,
              templateLanguage,
              message,
              config,
            ),
          ),
      )),
    );
  }
  return results;
}

export async function sendCampaign(args: {
  channel: CampaignChannel;
  recipients: Recipient[];
  subject?: string;
  message: string;
  templateName?: string;
  templateLanguage?: string;
}) {
  if (args.channel === "email") {
    return sendEmailCampaign(
      args.recipients,
      args.subject || "A note from K1 Nut's",
      args.message,
    );
  }
  if (!args.templateName) {
    throw new Error("An approved WhatsApp template name is required.");
  }
  return sendWhatsAppCampaign(
    args.recipients,
    args.templateName,
    args.templateLanguage || "en_US",
    args.message,
  );
}
