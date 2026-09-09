"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type SupportMessage = {
  id: number;
  sender: "customer" | "bot" | "admin";
  body: string;
  createdAt: number;
};

type SupportPayload = {
  conversation: { id: number; status: string } | null;
  messages: SupportMessage[];
  error?: string;
};

export function SupportChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || ready) return;
    let active = true;
    fetch("/api/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    })
      .then(async (response) => {
        const result = (await response.json()) as SupportPayload;
        if (!response.ok) throw new Error(result.error || "Concierge is unavailable.");
        if (active) {
          setMessages(result.messages);
          setReady(true);
        }
      })
      .catch((reason: Error) => active && setError(reason.message));
    return () => {
      active = false;
    };
  }, [open, ready]);

  useEffect(() => {
    if (!open || !ready) return;
    const poll = async () => {
      const lastId = messages.at(-1)?.id ?? 0;
      const response = await fetch(`/api/support?after=${lastId}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const result = (await response.json()) as SupportPayload;
      if (result.messages.length) {
        setMessages((current) => {
          const seen = new Set(current.map((message) => message.id));
          return [...current, ...result.messages.filter((message) => !seen.has(message.id))];
        });
      }
    };
    const timer = window.setInterval(() => void poll(), 3500);
    return () => window.clearInterval(timer);
  }, [messages, open, ready]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const field = form.elements.namedItem("message") as HTMLInputElement;
    const message = field.value.trim();
    if (!message) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "message", message }),
    });
    const result = (await response.json()) as SupportPayload;
    setBusy(false);
    if (!response.ok) {
      setError(result.error || "Your message could not be sent.");
      return;
    }
    field.value = "";
    setMessages(result.messages);
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/invoice")) {
    return null;
  }

  return (
    <aside className={`supportChat ${open ? "open" : ""}`}>
      {open && (
        <section className="supportChatPanel" aria-label="K1 Concierge">
          <header>
            <span className="supportAvatar">K1</span>
            <div>
              <b>K1 Concierge</b>
              <small><i /> Quick guidance · team support</small>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close K1 Concierge">×</button>
          </header>
          <div className="supportMessages" ref={scrollRef} aria-live="polite">
            {!ready && !error && <p className="supportLoading">Opening your private conversation…</p>}
            {messages.map((message) => (
              <article className={message.sender} key={message.id}>
                <small>{message.sender === "customer" ? "YOU" : message.sender === "admin" ? "K1 TEAM" : "K1 CONCIERGE"}</small>
                <p>{message.body}</p>
              </article>
            ))}
            {error && <p className="supportError" role="alert">{error}</p>}
          </div>
          <form onSubmit={send}>
            <input
              name="message"
              maxLength={1000}
              placeholder="Ask about a product or order…"
              aria-label="Message K1 Concierge"
              disabled={!ready || busy}
            />
            <button disabled={!ready || busy} aria-label="Send message">↑</button>
          </form>
          <footer>Your conversation is saved securely on K1.</footer>
        </section>
      )}
      <button
        className="supportLauncher"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close K1 Concierge" : "Chat with K1 Concierge"}
      >
        <span>{open ? "×" : "✦"}</span>
        {!open && <b>ASK K1</b>}
      </button>
    </aside>
  );
}
