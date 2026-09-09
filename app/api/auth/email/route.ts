import { env } from "cloudflare:workers";
import {
  createCustomerSession,
  createOtpCode,
  getCustomerAuthConfiguration,
  hashOtp,
  hashPassword,
  normalizeEmail,
  sendEmailOtp,
  verifyPassword,
} from "../../../customer-auth";

export const dynamic = "force-dynamic";

type AccountRow = {
  user_id: string;
  email: string;
  display_name: string;
  password_hash: string | null;
  email_verified: number;
};

function validPassword(value: unknown) {
  const password = typeof value === "string" ? value : "";
  return password.length >= 10 && password.length <= 128 ? password : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    email?: unknown;
    password?: unknown;
    displayName?: unknown;
    code?: unknown;
    purpose?: unknown;
  } | null;
  const action = body?.action;
  const email = normalizeEmail(body?.email);
  if (!email) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (action === "verify") {
    const code = String(body?.code ?? "").replace(/\D/g, "").slice(0, 6);
    const purpose = String(body?.purpose ?? "");
    if (code.length !== 6 || !["login", "register"].includes(purpose)) {
      return Response.json({ error: "Enter the six-digit code from your email." }, { status: 400 });
    }
    const otp = await env.DB.prepare(
      `SELECT id, code_hash AS codeHash, expires_at AS expiresAt, attempts
       FROM email_otp_codes
       WHERE email = ? AND purpose = ? AND consumed_at IS NULL
       ORDER BY id DESC LIMIT 1`,
    )
      .bind(email, purpose)
      .first<{ id: number; codeHash: string; expiresAt: number; attempts: number }>();
    if (!otp || otp.expiresAt < Date.now() || otp.attempts >= 5) {
      return Response.json({ error: "This code has expired. Request a new one." }, { status: 400 });
    }
    if ((await hashOtp(email, code)) !== otp.codeHash) {
      await env.DB.prepare("UPDATE email_otp_codes SET attempts = attempts + 1 WHERE id = ?")
        .bind(otp.id)
        .run();
      return Response.json({ error: "That code is incorrect." }, { status: 400 });
    }
    const account = await env.DB.prepare(
      "SELECT user_id AS userId FROM customer_accounts WHERE email = ? LIMIT 1",
    )
      .bind(email)
      .first<{ userId: string }>();
    if (!account) return Response.json({ error: "Account not found." }, { status: 404 });
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare("UPDATE email_otp_codes SET consumed_at = ? WHERE id = ?").bind(now, otp.id),
      env.DB.prepare("UPDATE customer_accounts SET email_verified = 1, updated_at = ? WHERE email = ?").bind(now, email),
    ]);
    await createCustomerSession(account.userId);
    return Response.json({ ok: true });
  }

  if (!getCustomerAuthConfiguration().emailPasswordOtp) {
    return Response.json(
      { error: "Email sign-in is awaiting the K1 email provider configuration." },
      { status: 503 },
    );
  }
  if (action !== "login" && action !== "register") {
    return Response.json({ error: "Choose sign in or create account." }, { status: 400 });
  }
  const password = validPassword(body?.password);
  if (!password) {
    return Response.json({ error: "Use a password of at least 10 characters." }, { status: 400 });
  }
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM email_otp_codes WHERE email = ? AND created_at > ?",
  )
    .bind(email, Date.now() - 10 * 60 * 1000)
    .first<{ count: number }>();
  if (Number(recent?.count ?? 0) >= 3) {
    return Response.json(
      { error: "Too many codes were requested. Please wait 10 minutes." },
      { status: 429 },
    );
  }

  let account = await env.DB.prepare(
    `SELECT user_id, email, display_name, password_hash, email_verified
     FROM customer_accounts WHERE email = ? LIMIT 1`,
  )
    .bind(email)
    .first<AccountRow>();
  const now = Date.now();
  if (action === "register") {
    const displayName = String(body?.displayName ?? "").trim().slice(0, 80);
    if (displayName.length < 2) {
      return Response.json({ error: "Enter your name." }, { status: 400 });
    }
    if (account?.email_verified) {
      return Response.json({ error: "An account already exists. Sign in instead." }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const userId = account?.user_id || `k1:${crypto.randomUUID()}`;
    await env.DB.prepare(
      `INSERT INTO customer_accounts (user_id, email, display_name, password_hash, email_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)
       ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, password_hash = excluded.password_hash, updated_at = excluded.updated_at`,
    )
      .bind(userId, email, displayName, passwordHash, now, now)
      .run();
    account = {
      user_id: userId,
      email,
      display_name: displayName,
      password_hash: passwordHash,
      email_verified: 0,
    };
  } else {
    if (
      !account?.password_hash ||
      !account.email_verified ||
      !(await verifyPassword(password, account.password_hash))
    ) {
      return Response.json({ error: "The email or password is incorrect." }, { status: 401 });
    }
  }

  const code = createOtpCode();
  const delivery = await sendEmailOtp(email, code, String(action));
  if (!delivery.delivered) {
    return Response.json(
      { error: "The verification email could not be sent. Please try again shortly." },
      { status: 503 },
    );
  }
  await env.DB.prepare(
    "INSERT INTO email_otp_codes (email, code_hash, purpose, expires_at, attempts, consumed_at, created_at) VALUES (?, ?, ?, ?, 0, NULL, ?)",
  )
    .bind(email, await hashOtp(email, code), action, now + 10 * 60 * 1000, now)
    .run();
  return Response.json({
    ok: true,
    challenge: { email, purpose: action, expiresInSeconds: 600 },
    ...(delivery.developmentCode ? { developmentCode: delivery.developmentCode } : {}),
  });
}
