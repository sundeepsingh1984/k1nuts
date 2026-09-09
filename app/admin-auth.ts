import { env } from "cloudflare:workers";
import { cookies } from "next/headers";

const COOKIE_NAME = "k1_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;
const LOCAL_USERNAME = "admin";
const LOCAL_PASSWORD = "K1Nuts@2026!";
const LOCAL_SESSION_SECRET =
  "k1-local-admin-session-secret-change-before-production";
const encoder = new TextEncoder();

export type AdminUser = {
  userId: string;
  email: string;
  displayName: string;
  fullName: string;
};

function runtimeValues() {
  return env as unknown as Record<string, string | undefined>;
}

function isLocalDevelopment() {
  return process.env.NODE_ENV === "development";
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function adminConfiguration() {
  const values = runtimeValues();
  const username = values.K1_ADMIN_USERNAME?.trim();
  const passwordHash = values.K1_ADMIN_PASSWORD_SHA256?.trim().toLowerCase();
  const sessionSecret = values.K1_ADMIN_SESSION_SECRET?.trim();

  if (username && passwordHash && sessionSecret) {
    return { username, passwordHash, sessionSecret };
  }

  if (!isLocalDevelopment()) return null;
  return {
    username: LOCAL_USERNAME,
    passwordHash: await sha256(LOCAL_PASSWORD),
    sessionSecret: LOCAL_SESSION_SECRET,
  };
}

export async function adminCredentialsConfigured() {
  return Boolean(await adminConfiguration());
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
) {
  const configuration = await adminConfiguration();
  if (!configuration) return false;
  const passwordHash = await sha256(password);
  return (
    constantTimeEqual(username.trim(), configuration.username) &&
    constantTimeEqual(passwordHash, configuration.passwordHash)
  );
}

export async function createAdminSession(username: string) {
  const configuration = await adminConfiguration();
  if (!configuration || username.trim() !== configuration.username) {
    throw new Error("Admin credentials are not configured.");
  }
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const encodedUsername = bytesToBase64Url(encoder.encode(configuration.username));
  const payload = `${encodedUsername}.${expiresAt}`;
  const signature = await sign(payload, configuration.sessionSecret);
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: !isLocalDevelopment(),
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: !isLocalDevelopment(),
    path: "/",
    maxAge: 0,
  });
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const configuration = await adminConfiguration();
  if (!configuration) return null;
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const payloadParts = payload.split(".");
  if (payloadParts.length !== 2) return null;
  const expiresAt = Number(payloadParts[1]);
  if (!Number.isInteger(expiresAt) || expiresAt <= Date.now() / 1000) return null;
  const expectedSignature = await sign(payload, configuration.sessionSecret);
  if (!constantTimeEqual(signature, expectedSignature)) return null;
  const expectedUsername = bytesToBase64Url(
    encoder.encode(configuration.username),
  );
  if (!constantTimeEqual(payloadParts[0], expectedUsername)) return null;

  return {
    userId: `admin:${configuration.username}`,
    email: `${configuration.username}@k1.local`,
    displayName: "K1 Administrator",
    fullName: "K1 Administrator",
  };
}
