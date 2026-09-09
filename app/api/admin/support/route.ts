import { env } from "cloudflare:workers";
import { getAdminUser } from "../../../admin-auth";

export const dynamic = "force-dynamic";

async function authorised() {
  return Boolean(await getAdminUser());
}

export async function GET(request: Request) {
  if (!(await authorised())) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  const conversationId = Number(
    new URL(request.url).searchParams.get("conversationId"),
  );
  if (Number.isInteger(conversationId) && conversationId > 0) {
    const messages = await env.DB.prepare(
      "SELECT id, sender, body, created_at AS createdAt, read_at AS readAt FROM support_messages WHERE conversation_id = ? ORDER BY id ASC LIMIT 250",
    )
      .bind(conversationId)
      .all<{
        id: number;
        sender: string;
        body: string;
        createdAt: number;
        readAt: number | null;
      }>();
    await env.DB.prepare(
      "UPDATE support_messages SET read_at = ? WHERE conversation_id = ? AND sender = 'customer' AND read_at IS NULL",
    )
      .bind(Date.now(), conversationId)
      .run();
    return Response.json(
      { messages: messages.results },
      { headers: { "cache-control": "private, no-store" } },
    );
  }

  const conversations = await env.DB.prepare(
    `SELECT c.id, c.customer_name AS customerName, c.customer_email AS customerEmail,
      c.status, c.last_message_at AS lastMessageAt,
      (SELECT body FROM support_messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS lastMessage,
      (SELECT COUNT(*) FROM support_messages m WHERE m.conversation_id = c.id AND m.sender = 'customer' AND m.read_at IS NULL) AS unread
     FROM support_conversations c ORDER BY c.last_message_at DESC LIMIT 50`,
  ).all<{
    id: number;
    customerName: string | null;
    customerEmail: string | null;
    status: string;
    lastMessageAt: number;
    lastMessage: string;
    unread: number;
  }>();
  return Response.json(
    { conversations: conversations.results },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  if (!(await authorised())) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    conversationId?: unknown;
    message?: unknown;
    status?: unknown;
  } | null;
  const conversationId = Number(body?.conversationId);
  if (!Number.isInteger(conversationId) || conversationId < 1) {
    return Response.json({ error: "Conversation is required." }, { status: 400 });
  }
  const status = body?.status === "resolved" ? "resolved" : body?.status === "open" ? "open" : null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message && !status) {
    return Response.json({ error: "A reply or status is required." }, { status: 400 });
  }
  if (message.length > 1000) {
    return Response.json({ error: "Replies are limited to 1,000 characters." }, { status: 400 });
  }
  const conversation = await env.DB.prepare(
    "SELECT id FROM support_conversations WHERE id = ? LIMIT 1",
  )
    .bind(conversationId)
    .first<{ id: number }>();
  if (!conversation) {
    return Response.json({ error: "Conversation not found." }, { status: 404 });
  }
  const now = Date.now();
  const statements = [];
  if (message) {
    statements.push(
      env.DB.prepare(
        "INSERT INTO support_messages (conversation_id, sender, body, created_at, read_at) VALUES (?, 'admin', ?, ?, NULL)",
      ).bind(conversationId, message, now),
    );
  }
  statements.push(
    env.DB.prepare(
      "UPDATE support_conversations SET status = ?, last_message_at = ?, updated_at = ? WHERE id = ?",
    ).bind(status ?? "open", now, now, conversationId),
  );
  await env.DB.batch(statements);
  return Response.json(
    { ok: true },
    { headers: { "cache-control": "private, no-store" } },
  );
}
