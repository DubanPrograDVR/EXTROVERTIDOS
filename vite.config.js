import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Separar chunks de vendors para mejor caching
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-icons": [
            "@fortawesome/fontawesome-svg-core",
            "@fortawesome/react-fontawesome",
            "@fortawesome/free-solid-svg-icons",
            "@fortawesome/free-brands-svg-icons",
            "@fortawesome/free-regular-svg-icons",
          ],
          "vendor-charts": ["recharts"],
        },
      },
    },
    // Comprimir CSS
    cssCodeSplit: true,
    // Target moderno para mejor performance
    target: "es2020",
    // Minificación
    minify: "esbuild",
    // Source maps solo en dev
    sourcemap: false,
    // Tamaño de chunk warning
    chunkSizeWarningLimit: 1000,
  },
  // Optimizar dependencias
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
    ],
  },
});
