import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getChatGPTUser } from "./chatgpt-auth";

const SESSION_COOKIE = "k1_customer_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const LOCAL_AUTH_SECRET = "k1-local-customer-auth-secret-development-only";
const encoder = new TextEncoder();

export type CustomerUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
  source: "k1" | "chatgpt";
};

function values() {
  return env as unknown as Record<string, string | undefined>;
}

export function isLocalDevelopment() {
  return process.env.NODE_ENV === "development";
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function randomHex(length = 32) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(length)));
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToHex(new Uint8Array(digest));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function normalizeEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase().slice(0, 180);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function safeReturnTo(value: unknown) {
  const path = typeof value === "string" ? value : "/account";
  if (!path.startsWith("/") || path.startsWith("//")) return "/account";
  try {
    const url = new URL(path, "https://k1.local");
    if (url.origin !== "https://k1.local") return "/account";
    if (url.pathname.startsWith("/api/auth")) return "/account";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/account";
  }
}

function authSecret() {
  return values().K1_AUTH_SECRET?.trim() || (isLocalDevelopment() ? LOCAL_AUTH_SECRET : "");
}

export function getCustomerAuthConfiguration() {
  const runtime = values();
  const secretReady = Boolean(authSecret());
  const emailProvider = Boolean(
    runtime.RESEND_API_KEY?.trim() &&
      (runtime.K1_AUTH_FROM_EMAIL?.trim() || runtime.MARKETING_FROM_EMAIL?.trim()),
  );
  return {
    emailPasswordOtp: secretReady && (emailProvider || isLocalDevelopment()),
    google:
      secretReady &&
      Boolean(
        runtime.GOOGLE_OAUTH_CLIENT_ID?.trim() &&
          runtime.GOOGLE_OAUTH_CLIENT_SECRET?.trim(),
      ),
    developmentOtp: isLocalDevelopment(),
  };
}

export function getGoogleOauthConfiguration(requestUrl: string) {
  const runtime = values();
  const clientId = runtime.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = runtime.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const configuredOrigin = runtime.NEXT_PUBLIC_SITE_URL?.trim();
  const origin = configuredOrigin
    ? new URL(configuredOrigin).origin
    : new URL(requestUrl).origin;
  if (!clientId || !clientSecret || !authSecret()) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: `${origin}/api/auth/google`,
  };
}

export async function hashPassword(password: string) {
  const iterations = 120_000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return `pbkdf2$${iterations}$${bytesToHex(salt)}$${bytesToHex(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, iterationsText, saltHex, expected] = encoded.split("$");
  const iterations = Number(iterationsText);
  if (
    algorithm !== "pbkdf2" ||
    !Number.isInteger(iterations) ||
    iterations < 100_000 ||
    !saltHex ||
    !expected
  ) {
    return false;
  }
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(saltHex), iterations },
    key,
    256,
  );
  return constantTimeEqual(bytesToHex(new Uint8Array(bits)), expected);
}

export function createOtpCode() {
  const bytes = crypto.getRandomValues(new Uint32Array(1));
  return String(bytes[0] % 1_000_000).padStart(6, "0");
}

export async function hashOtp(email: string, code: string) {
  return sha256Hex(`${normalizeEmail(email)}:${code}:${authSecret()}`);
}

export async function sendEmailOtp(email: string, code: string, purpose: string) {
  const runtime = values();
  if (isLocalDevelopment() && !runtime.RESEND_API_KEY) {
    return { delivered: true, developmentCode: code };
  }
  const apiKey = runtime.RESEND_API_KEY?.trim();
  const from =
    runtime.K1_AUTH_FROM_EMAIL?.trim() || runtime.MARKETING_FROM_EMAIL?.trim();
  if (!apiKey || !from) return { delivered: false, developmentCode: null };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your K1 Nuts verification code",
      text: `Your K1 Nuts verification code is ${code}. It expires in 10 minutes. If you did not request this ${purpose}, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;color:#173b34;max-width:520px;margin:auto;padding:32px"><h1 style="font-family:Georgia,serif">K1 Nuts</h1><p>Use this verification code to complete your ${purpose}:</p><p style="font-size:34px;letter-spacing:8px;font-weight:700">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`,
    }),
  });
  return { delivered: response.ok, developmentCode: null };
}

export async function createCustomerSession(userId: string) {
  const secret = authSecret();
  if (!secret) throw new Error("Customer authentication is not configured.");
  const token = randomHex();
  const tokenHash = await sha256Hex(`${token}:${secret}`);
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO customer_sessions (token_hash, user_id, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(tokenHash, userId, now + SESSION_SECONDS * 1000, now, now)
    .run();
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: !isLocalDevelopment(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearCustomerSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && authSecret()) {
    await env.DB.prepare("DELETE FROM customer_sessions WHERE token_hash = ?")
      .bind(await sha256Hex(`${token}:${authSecret()}`))
      .run()
      .catch(() => undefined);
  }
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: !isLocalDevelopment(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function getAppCustomerUser(): Promise<CustomerUser | null> {
  const secret = authSecret();
  if (!secret) return null;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const row = await env.DB.prepare(
      `SELECT a.user_id AS userId, a.email, a.display_name AS displayName
       FROM customer_sessions s
       JOIN customer_accounts a ON a.user_id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND a.email_verified = 1
       LIMIT 1`,
    )
      .bind(await sha256Hex(`${token}:${secret}`), Date.now())
      .first<{ userId: string; email: string; displayName: string }>();
    if (!row) return null;
    return {
      userId: row.userId,
      email: row.email,
      displayName: row.displayName,
      fullName: row.displayName,
      source: "k1",
    };
  } catch {
    return null;
  }
}

export async function getCustomerUser(): Promise<CustomerUser | null> {
  const appUser = await getAppCustomerUser();
  if (appUser) return appUser;
  const chatGPTUser = await getChatGPTUser();
  return chatGPTUser
    ? { ...chatGPTUser, source: "chatgpt" }
    : null;
}

export async function requireCustomerUser(returnTo: string) {
  const user = await getCustomerUser();
  if (user) return user;
  redirect(`/login?return_to=${encodeURIComponent(safeReturnTo(returnTo))}`);
}
