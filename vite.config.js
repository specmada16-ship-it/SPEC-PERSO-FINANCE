import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        // Landing page = page d'accueil
        main: resolve(__dirname, "index.html"),
        // App React = accessible sur /app
        app: resolve(__dirname, "app.html"),
      },
    },
  },
});
