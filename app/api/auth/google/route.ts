import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import {
  createCustomerSession,
  getGoogleOauthConfiguration,
  normalizeEmail,
  safeReturnTo,
  sha256Hex,
} from "../../../customer-auth";

export const dynamic = "force-dynamic";
const STATE_COOKIE = "k1_google_oauth";

function encode(value: string) {
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function decode(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}

function redirectWithError(request: Request, error: string) {
  return Response.redirect(
    new URL(`/login?error=${encodeURIComponent(error)}`, request.url),
    302,
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const configuration = getGoogleOauthConfiguration(request.url);
  if (!configuration) return redirectWithError(request, "Google sign-in is awaiting configuration.");
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const store = await cookies();

  if (!code) {
    const state = crypto.randomUUID();
    const returnTo = safeReturnTo(url.searchParams.get("return_to"));
    store.set(STATE_COOKIE, `${state}.${encode(returnTo)}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    google.searchParams.set("client_id", configuration.clientId);
    google.searchParams.set("redirect_uri", configuration.redirectUri);
    google.searchParams.set("response_type", "code");
    google.searchParams.set("scope", "openid email profile");
    google.searchParams.set("state", state);
    google.searchParams.set("prompt", "select_account");
    return Response.redirect(google, 302);
  }

  const savedState = store.get(STATE_COOKIE)?.value;
  store.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
  if (!savedState || !returnedState) return redirectWithError(request, "Google sign-in expired. Please try again.");
  const separator = savedState.indexOf(".");
  if (separator < 1) {
    return redirectWithError(request, "Google sign-in could not be verified.");
  }
  const expectedState = savedState.slice(0, separator);
  if (expectedState !== returnedState) {
    return redirectWithError(request, "Google sign-in could not be verified.");
  }
  let returnTo = "/account";
  try {
    returnTo = safeReturnTo(decode(savedState.slice(separator + 1)));
  } catch {
    return redirectWithError(request, "Google sign-in could not be verified.");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: configuration.clientId,
      client_secret: configuration.clientSecret,
      redirect_uri: configuration.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) return redirectWithError(request, "Google sign-in was not completed.");
  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) return redirectWithError(request, "Google did not return an access token.");
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` },
  });
  const profile = (await profileResponse.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
  const email = normalizeEmail(profile.email);
  if (!profileResponse.ok || !profile.sub || !email || !profile.email_verified) {
    return redirectWithError(request, "Google could not verify this email address.");
  }

  const oauth = await env.DB.prepare(
    "SELECT user_id AS userId FROM customer_oauth_accounts WHERE provider = 'google' AND provider_subject = ? LIMIT 1",
  )
    .bind(profile.sub)
    .first<{ userId: string }>();
  const emailAccount = await env.DB.prepare(
    "SELECT user_id AS userId FROM customer_accounts WHERE email = ? LIMIT 1",
  )
    .bind(email)
    .first<{ userId: string }>();
  const userId = oauth?.userId || emailAccount?.userId || `k1:${crypto.randomUUID()}`;
  const displayName = String(profile.name || email.split("@")[0]).trim().slice(0, 80);
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO customer_accounts (user_id, email, display_name, password_hash, email_verified, created_at, updated_at)
       VALUES (?, ?, ?, NULL, 1, ?, ?)
       ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, email_verified = 1, updated_at = excluded.updated_at`,
    ).bind(userId, email, displayName, now, now),
    env.DB.prepare(
      `INSERT INTO customer_oauth_accounts (provider, provider_subject, user_id, created_at, updated_at)
       VALUES ('google', ?, ?, ?, ?)
       ON CONFLICT(provider, provider_subject) DO UPDATE SET user_id = excluded.user_id, updated_at = excluded.updated_at`,
    ).bind(profile.sub, userId, now, now),
  ]);
  await createCustomerSession(userId);
  return Response.redirect(new URL(returnTo, request.url), 302);
}
