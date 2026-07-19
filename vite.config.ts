import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Dev proxy: when VITE_JAWBOT_URL is unset, /api and /ws hit the local JawBot.
 * On Windows pointing at a remote Linux host, set VITE_JAWBOT_URL instead
 * (CORS is open on JawBot for the PoC).
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const jawbot = env.VITE_JAWBOT_URL?.replace(/\/$/, "") || "http://127.0.0.1:8787";

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: jawbot,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/ws": {
          target: jawbot.replace(/^http/, "ws"),
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
