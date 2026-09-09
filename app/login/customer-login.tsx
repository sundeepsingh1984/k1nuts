"use client";

import { FormEvent, useState } from "react";

type AuthConfiguration = {
  emailPasswordOtp: boolean;
  google: boolean;
  developmentOtp: boolean;
};

export default function CustomerLogin({
  configuration,
  returnTo,
  initialError,
}: {
  configuration: AuthConfiguration;
  returnTo: string;
  initialError: string;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [challenge, setChallenge] = useState<{ email: string; purpose: "login" | "register" } | null>(null);
  const [developmentCode, setDevelopmentCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: mode,
        displayName: form.get("displayName"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const result = (await response.json()) as {
      error?: string;
      challenge?: { email: string; purpose: "login" | "register" };
      developmentCode?: string;
    };
    setBusy(false);
    if (!response.ok || !result.challenge) {
      setError(result.error || "A verification code could not be sent.");
      return;
    }
    setChallenge(result.challenge);
    setDevelopmentCode(result.developmentCode || "");
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "verify",
        purpose: challenge.purpose,
        email: challenge.email,
        code: form.get("code"),
      }),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(result.error || "The code could not be verified.");
      return;
    }
    window.location.replace(returnTo);
  }

  return (
    <section className="customerLoginCard">
      <div className="customerLoginIntro">
        <small>SECURE CUSTOMER ACCESS</small>
        <h2>{challenge ? "Check your email" : mode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p>
          {challenge
            ? `Enter the six-digit code sent to ${challenge.email}.`
            : "Choose Google or use your email and password. Password sign-in always includes email verification."}
        </p>
      </div>

      {!challenge && (
        <>
          {configuration.google ? (
            <a className="googleLoginButton" href={`/api/auth/google?return_to=${encodeURIComponent(returnTo)}`}>
              <span>G</span> CONTINUE WITH GOOGLE
            </a>
          ) : (
            <button className="googleLoginButton disabled" disabled title="Google OAuth credentials are required">
              <span>G</span> GOOGLE SIGN-IN · SETUP REQUIRED
            </button>
          )}
          <div className="loginDivider"><span>OR CONTINUE WITH EMAIL</span></div>
          <div className="loginModeSwitch" role="tablist" aria-label="Email account action">
            <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>SIGN IN</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>CREATE ACCOUNT</button>
          </div>
          <form className="customerEmailForm" onSubmit={requestCode}>
            {mode === "register" && (
              <label>
                Full name
                <input name="displayName" autoComplete="name" required minLength={2} placeholder="Your name" />
              </label>
            )}
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={10} required placeholder="At least 10 characters" />
            </label>
            {error && <p className="loginError" role="alert">{error}</p>}
            {!configuration.emailPasswordOtp && (
              <p className="loginSetupNote">Email OTP is awaiting the secure mail provider credentials.</p>
            )}
            <button className="customerLoginPrimary" disabled={busy || !configuration.emailPasswordOtp}>
              {busy ? "SENDING CODE…" : "CONTINUE TO EMAIL CODE →"}
            </button>
          </form>
        </>
      )}

      {challenge && (
        <form className="customerOtpForm" onSubmit={verifyCode}>
          <label>
            Six-digit verification code
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              required
            />
          </label>
          {developmentCode && (
            <p className="developmentOtp">LOCAL PREVIEW CODE · <b>{developmentCode}</b></p>
          )}
          {error && <p className="loginError" role="alert">{error}</p>}
          <button className="customerLoginPrimary" disabled={busy}>
            {busy ? "VERIFYING…" : "VERIFY & SIGN IN →"}
          </button>
          <button type="button" className="loginBack" onClick={() => { setChallenge(null); setDevelopmentCode(""); setError(""); }}>
            ← Use a different email
          </button>
        </form>
      )}

      <footer>
        <b>Protected sign-in</b>
        <span>Passwords are slow-hashed. Codes expire in 10 minutes and lock after repeated failures.</span>
      </footer>
    </section>
  );
}
