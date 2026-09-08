import { env } from "cloudflare:workers";
import { getChatGPTUser } from "./chatgpt-auth";

function configuredEmails() {
  const values = env as unknown as Record<string, string | undefined>;
  return (values.K1_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function adminAllowlistConfigured() {
  return configuredEmails().length > 0;
}

export function isAdminEmail(email: string) {
  const allowlist = configuredEmails();
  return allowlist.length === 0 || allowlist.includes(email.toLowerCase());
}

export async function getAdminUser() {
  const user = await getChatGPTUser();
  return user && isAdminEmail(user.email) ? user : null;
}
