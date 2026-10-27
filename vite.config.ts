import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  publicDir: "static",
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          gsap: ["gsap", "gsap/ScrollTrigger", "gsap/SplitText", "gsap/Flip", "gsap/DrawSVGPlugin", "@gsap/react", "lenis"],
          radix: ["@radix-ui/react-dialog"],
        },
      },
    },
  },
});
