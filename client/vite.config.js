import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: "window",
  },
  server: {
    proxy: {
      "/api": {
        target:
          process.env.VITE_BACKEND_URL ||
          process.env.VITE_DEV_BACKEND_URL ||
          "https://guftgu-fsrp.onrender.com",
        changeOrigin: true,
      },
    },
  },
});
