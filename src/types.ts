/** Mirror of JawBot shared chat types — keep in sync with sunnydie86/JawBot. */

export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: Role;
  content: string;
  ts: string;
  jobIds?: string[];
}

export interface Session {
  id: string;
  channel: string;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  sessionId: string;
  skill: string;
  input: Record<string, unknown>;
  status: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  result?: Record<string, unknown>;
}
