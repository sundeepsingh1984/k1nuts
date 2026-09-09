import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { getCustomerUser } from "../../customer-auth";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "k1_support";
const COOKIE_SECONDS = 60 * 60 * 24 * 180;
const encoder = new TextEncoder();

type ConversationRow = {
  id: number;
  status: string;
  customer_name: string | null;
};

function newVisitorToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function conversationForToken(token: string) {
  return env.DB.prepare(
    "SELECT id, status, customer_name FROM support_conversations WHERE visitor_token_hash = ? LIMIT 1",
  )
    .bind(await tokenHash(token))
    .first<ConversationRow>();
}

async function messagesFor(conversationId: number, after = 0) {
  const result = await env.DB.prepare(
    "SELECT id, sender, body, created_at AS createdAt FROM support_messages WHERE conversation_id = ? AND id > ? ORDER BY id ASC LIMIT 100",
  )
    .bind(conversationId, after)
    .all<{ id: number; sender: string; body: string; createdAt: number }>();
  return result.results;
}

function botReply(message: string) {
  const text = message.toLowerCase();
  if (/track|order|where|delivery/.test(text)) {
    return "For order tracking, open My K1 → Orders & tracking. If you share the order number here, the K1 team can also check it for you.";
  }
  if (/return|refund|damag|replace/.test(text)) {
    return "I’m sorry something is not right. Please share the order number and a short description; the K1 team will review the return or replacement request here.";
  }
  if (/recommend|best|gift|healthy|snack/.test(text)) {
    return "For healthy gifting, Kashmiri Mewa Bites are the signature choice. For a richer treat, try Chocolate Truffle Bites. Tell me your taste or budget and the team can recommend a pack.";
  }
  if (/ship|courier|pin|arrive/.test(text)) {
    return "K1 ships across India, with final delivery estimates calculated from the destination PIN code. Share your PIN code here and the team can help confirm serviceability.";
  }
  if (/price|offer|coupon|discount|50/.test(text)) {
    return "The current launch offer is 50% off MRP across the store. The price shown on each pack size is the offer price before any extra eligible coupon.";
  }
  return "Thank you—your message is saved in the K1 support inbox. A team member can join this conversation and reply here shortly.";
}

async function getOrCreateConversation() {
  const store = await cookies();
  let token = store.get(COOKIE_NAME)?.value;
  let conversation = token ? await conversationForToken(token) : null;
  if (conversation) return { conversation, token };

  token = newVisitorToken();
  const now = Date.now();
  const user = await getCustomerUser();
  const inserted = await env.DB.prepare(
    "INSERT INTO support_conversations (visitor_token_hash, user_id, customer_name, customer_email, status, last_message_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'open', ?, ?, ?)",
  )
    .bind(
      await tokenHash(token),
      user?.userId ?? null,
      user?.displayName ?? null,
      user?.email ?? null,
      now,
      now,
      now,
    )
    .run();
  const conversationId = Number(inserted.meta.last_row_id);
  await env.DB.prepare(
    "INSERT INTO support_messages (conversation_id, sender, body, created_at, read_at) VALUES (?, 'bot', ?, ?, NULL)",
  )
    .bind(
      conversationId,
      "Welcome to K1 Concierge. I can help with products, delivery and orders—and the K1 team can join this conversation when you need a person.",
      now,
    )
    .run();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    maxAge: COOKIE_SECONDS,
  });
  conversation = { id: conversationId, status: "open", customer_name: user?.displayName ?? null };
  return { conversation, token };
}

export async function GET(request: Request) {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) {
    return Response.json(
      { conversation: null, messages: [] },
      { headers: { "cache-control": "private, no-store" } },
    );
  }
  const conversation = await conversationForToken(token);
  if (!conversation) {
    return Response.json(
      { conversation: null, messages: [] },
      { headers: { "cache-control": "private, no-store" } },
    );
  }
  const after = Math.max(0, Number(new URL(request.url).searchParams.get("after")) || 0);
  const messages = await messagesFor(conversation.id, after);
  if (messages.some((message) => message.sender === "admin")) {
    await env.DB.prepare(
      "UPDATE support_messages SET read_at = ? WHERE conversation_id = ? AND sender = 'admin' AND read_at IS NULL",
    )
      .bind(Date.now(), conversation.id)
      .run();
  }
  return Response.json(
    { conversation, messages },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    message?: unknown;
    name?: unknown;
    email?: unknown;
  } | null;
  const { conversation } = await getOrCreateConversation();

  if (body?.action === "start" || !body?.action) {
    const messages = await messagesFor(conversation.id);
    return Response.json(
      { conversation, messages },
      { status: 201, headers: { "cache-control": "private, no-store" } },
    );
  }

  if (body.action !== "message") {
    return Response.json({ error: "Unsupported action." }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 1000) {
    return Response.json(
      { error: "Write a message between 1 and 1,000 characters." },
      { status: 400 },
    );
  }
  const now = Date.now();
  const reply = botReply(message);
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO support_messages (conversation_id, sender, body, created_at, read_at) VALUES (?, 'customer', ?, ?, NULL)",
    ).bind(conversation.id, message, now),
    env.DB.prepare(
      "INSERT INTO support_messages (conversation_id, sender, body, created_at, read_at) VALUES (?, 'bot', ?, ?, NULL)",
    ).bind(conversation.id, reply, now + 1),
    env.DB.prepare(
      "UPDATE support_conversations SET status = 'open', last_message_at = ?, updated_at = ? WHERE id = ?",
    ).bind(now + 1, now + 1, conversation.id),
  ]);
  return Response.json(
    { conversation: { ...conversation, status: "open" }, messages: await messagesFor(conversation.id) },
    { headers: { "cache-control": "private, no-store" } },
  );
}
