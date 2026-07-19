import { useEffect, useRef, useState } from "react";
import {
  chatWsUrl,
  createSession,
  health,
  listMessages,
  sendMessage,
  type ChatMessage,
} from "./api";

const SUGGESTIONS = [
  "Open a new shell tab",
  "Run uname -a",
  "What can you do?",
];

export function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [serverOk, setServerOk] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await createSession();
        if (cancelled) return;
        setSessionId(session.id);
        const existing = await listMessages(session.id);
        for (const m of existing) seenIds.current.add(m.id);
        setMessages(existing);
        if (existing.length > 0) setStarted(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      const ok = await health();
      if (!cancelled) setServerOk(ok);
    };
    void ping();
    const id = setInterval(ping, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const ws = new WebSocket(chatWsUrl());
    ws.onopen = () => {
      setLive(true);
      ws.send(JSON.stringify({ type: "subscribe", sessionId }));
    };
    ws.onclose = () => setLive(false);
    ws.onerror = () => setLive(false);
    ws.onmessage = (msg) => {
      try {
        const payload = JSON.parse(String(msg.data)) as {
          type?: string;
          message?: ChatMessage;
        };
        if (payload.type === "message" && payload.message) {
          const m = payload.message;
          if (seenIds.current.has(m.id)) return;
          seenIds.current.add(m.id);
          setMessages((prev) => [...prev, m]);
          setStarted(true);
        }
      } catch {
        /* ignore malformed frames */
      }
    };
    return () => ws.close();
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function onSend(text: string) {
    if (!sessionId || busy) return;
    const content = text.trim();
    if (!content) return;
    setError(null);
    setBusy(true);
    setStarted(true);
    setDraft("");
    try {
      const result = await sendMessage(sessionId, content);
      for (const m of [result.userMessage, result.assistantMessage]) {
        if (!m) continue;
        if (seenIds.current.has(m.id)) continue;
        seenIds.current.add(m.id);
        setMessages((prev) => [...prev, m]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`stage ${started ? "stage--chat" : "stage--hero"}`}>
      <div className="atmosphere" aria-hidden="true">
        <div className="tide" />
        <div className="fin-silhouette" />
      </div>

      <header className="brand-bar">
        <div className="link-status" aria-live="polite">
          <span className={`dot ${serverOk ? "ok" : "bad"}`} />
          <span>{serverOk ? "JawBot linked" : "JawBot offline"}</span>
          <span className="sep">·</span>
          <span>{live ? "live" : "reconnecting"}</span>
        </div>
      </header>

      <section className="hero" aria-label="Jaws">
        <p className="brand">JAWS</p>
        <h1 className="headline">Talk to the machine.</h1>
        <p className="lede">
          Ask in plain language. JawBot opens shells and runs work on Linux —
          you watch it happen.
        </p>
      </section>

      <main className="chat-panel">
        {!started && (
          <div className="suggestions" role="list">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                role="listitem"
                disabled={!sessionId || busy}
                onClick={() => void onSend(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {started && (
          <div className="thread" aria-live="polite">
            {messages.map((m) => (
              <article key={m.id} className={`turn ${m.role}`}>
                <div className="who">
                  {m.role === "user" ? "You" : "JawBot"}
                </div>
                <div className="say">{m.content}</div>
              </article>
            ))}
            {busy && (
              <article className="turn assistant thinking">
                <div className="who">JawBot</div>
                <div className="say">
                  <span className="pulse" />
                  Working…
                </div>
              </article>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <footer className="composer">
        {error && <p className="error">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSend(draft);
          }}
        >
          <label className="sr-only" htmlFor="jaws-draft">
            Message
          </label>
          <textarea
            id="jaws-draft"
            rows={2}
            value={draft}
            placeholder="Open a new shell tab…"
            disabled={!sessionId || busy}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSend(draft);
              }
            }}
          />
          <button type="submit" disabled={!sessionId || busy || !draft.trim()}>
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
