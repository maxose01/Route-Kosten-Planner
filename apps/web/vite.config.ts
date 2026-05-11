import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const extraAllowedHosts = (process.env.VITE_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter((host) => host.length > 0);

const allowedHosts = Array.from(
  new Set(["localhost", "127.0.0.1", ".ts.net", ...extraAllowedHosts])
);

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      }
    }
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts
  }
});
