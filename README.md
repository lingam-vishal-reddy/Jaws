# Jaws

Minimal chat frontend for **[JawBot](https://github.com/sunnydie86/JawBot)** — the Linux backend that opens terminals and runs machine work.

For the PoC, Jaws is a Windows-friendly browser UI used to exercise JawBot. Messaging apps (Slack, etc.) plug into the same JawBot message API later.

## Flow

```text
You (Jaws) ──"Open a new shell tab"──► JawBot ──► visible Linux terminal
```

## Quick start

1. Start JawBot on the Linux host (`npm run dev` → `:8787`).
2. Point Jaws at it:

```bash
npm install
VITE_JAWBOT_URL=http://<linux-host>:8787 npm run dev
```

Open the printed URL (usually `http://localhost:5173`).

If JawBot is on the same machine, omit `VITE_JAWBOT_URL` and the Vite proxy forwards `/api` and `/ws` to `127.0.0.1:8787`.

### Try

- **Open a new shell tab** — opens a visible terminal on the Linux desktop
- **Run uname -a** — runs a command and replies with output

## Stack

Vite + React + TypeScript. No auth (PoC).
