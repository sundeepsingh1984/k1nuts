import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { activityEvents } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getAdminUser } from "../../admin-auth";

const SESSION_COOKIE = "k1_session";

function readCookie(header: string | null, name: string) {
  return header
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1];
}

function classifyDevice(userAgent: string) {
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  if (/mobile|android|iphone/i.test(userAgent)) return "mobile";
  return "desktop";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      event?: string;
      path?: string;
      productSlug?: string;
      searchTerm?: string;
      resultCount?: number;
      referrer?: string;
      durationMs?: number;
      metadata?: Record<string, string | number | boolean>;
    };
    const event = body.event?.trim().slice(0, 50);
    const path = body.path?.trim().slice(0, 240);
    if (!event || !/^[a-z][a-z0-9_]{1,49}$/.test(event) || !path?.startsWith("/")) {
      return Response.json(
        { error: "A valid event and path are required." },
        { status: 400 },
      );
    }

    const currentSession = readCookie(
      request.headers.get("cookie"),
      SESSION_COOKIE,
    );
    const sessionId = currentSession || crypto.randomUUID();
    const user = await getChatGPTUser();
    const metadata = body.metadata
      ? JSON.stringify(body.metadata).slice(0, 1000)
      : null;
    const [row] = await getDb()
      .insert(activityEvents)
      .values({
        event,
        path,
        productSlug: body.productSlug?.trim().slice(0, 100) || null,
        sessionId,
        userId: user?.userId || null,
        searchTerm: body.searchTerm?.trim().toLowerCase().slice(0, 120) || null,
        resultCount: Number.isFinite(body.resultCount)
          ? Math.max(0, Math.min(10000, Math.round(body.resultCount || 0)))
          : null,
        referrer: body.referrer?.slice(0, 300) || null,
        metadata,
        durationMs: Number.isFinite(body.durationMs)
          ? Math.max(0, Math.min(120000, Math.round(body.durationMs || 0)))
          : null,
        device: classifyDevice(request.headers.get("user-agent") || ""),
        createdAt: Date.now(),
      })
      .returning();
    const response = Response.json({ event: row }, { status: 201 });
    response.headers.set(
      "set-cookie",
      `${SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=1800; HttpOnly; SameSite=Lax${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`,
    );
    response.headers.set("cache-control", "no-store");
    return response;
  } catch {
    return Response.json({ accepted: true }, { status: 202 });
  }
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await getDb()
      .select()
      .from(activityEvents)
      .orderBy(desc(activityEvents.createdAt))
      .limit(100);
    return Response.json(
      { events: rows },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch {
    return Response.json({ events: [] });
  }
}
