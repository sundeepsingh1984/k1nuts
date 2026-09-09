"use client";

import { FormEvent, useState } from "react";

export default function AdminLoginForm({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    configured ? "" : "Admin credentials are not configured on this server.",
  );

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setBusy(false);
      setError(result.error || "Sign in failed. Please try again.");
      return;
    }
    window.location.replace("/admin");
  }

  return (
    <form className="adminLoginForm" onSubmit={signIn}>
      <label>
        Username
        <input
          name="username"
          autoComplete="username"
          placeholder="Admin username"
          required
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Admin password"
          required
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy || !configured}>
        {busy ? "SIGNING IN…" : "OPEN K1 CONTROL →"}
      </button>
    </form>
  );
}
