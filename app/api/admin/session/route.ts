import {
  adminCredentialsConfigured,
  clearAdminSession,
  createAdminSession,
  verifyAdminCredentials,
} from "../../../admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await adminCredentialsConfigured())) {
    return Response.json(
      { error: "Admin credentials are not configured on this server." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  const body = (await request.json().catch(() => null)) as {
    username?: unknown;
    password?: unknown;
  } | null;
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const valid = await verifyAdminCredentials(username, password);
  if (!valid) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return Response.json(
      { error: "The username or password is incorrect." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }
  await createAdminSession(username);
  return Response.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function DELETE() {
  await clearAdminSession();
  return Response.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
}
