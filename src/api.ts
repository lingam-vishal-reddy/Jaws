import type { ChatMessage, Job, Session } from "./types";

/**
 * Resolve JawBot base URL.
 * - Prefer VITE_JAWBOT_URL for direct calls from Windows → Linux
 * - Fall back to same-origin /api (Vite proxy in local dev)
 */
function apiBase(): string {
  const direct = import.meta.env.VITE_JAWBOT_URL?.replace(/\/$/, "");
  if (direct) return direct;
  return import.meta.env.VITE_API_BASE ?? "/api";
}

export async function createSession(): Promise<Session> {
  const res = await fetch(`${apiBase()}/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channel: "jaws" }),
  });
  const data = (await res.json()) as { session?: Session; error?: string };
  if (!res.ok || !data.session) {
    throw new Error(data.error ?? `createSession failed (${res.status})`);
  }
  return data.session;
}

export async function listMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${apiBase()}/sessions/${sessionId}/messages`);
  const data = (await res.json()) as {
    messages?: ChatMessage[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `listMessages failed (${res.status})`);
  }
  return data.messages ?? [];
}

export async function sendMessage(
  sessionId: string,
  content: string,
): Promise<{
  userMessage: ChatMessage;
  assistantMessage?: ChatMessage;
  jobs: Job[];
}> {
  const res = await fetch(`${apiBase()}/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });
  const data = (await res.json()) as {
    userMessage?: ChatMessage;
    assistantMessage?: ChatMessage;
    jobs?: Job[];
    error?: string;
  };
  if (!res.ok || !data.userMessage) {
    throw new Error(data.error ?? `sendMessage failed (${res.status})`);
  }
  return {
    userMessage: data.userMessage,
    assistantMessage: data.assistantMessage,
    jobs: data.jobs ?? [],
  };
}

export async function health(): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export function chatWsUrl(): string {
  const configured = import.meta.env.VITE_WS_URL;
  if (configured) return configured;

  const direct = import.meta.env.VITE_JAWBOT_URL?.replace(/\/$/, "");
  if (direct) {
    const u = new URL(direct);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    u.pathname = "/ws/chat";
    u.search = "";
    u.hash = "";
    return u.toString();
  }

  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws/chat`;
}

export type { ChatMessage, Session, Job };
