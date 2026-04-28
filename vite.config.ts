import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.png",
        "grid-shock-128x128.png",
        "grid-shock-192x192.png",
        "grid-shock-512x512.png",
      ],

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {

        name: "Grid Shock",
        short_name: "GridShock",
        description: "A tactical chain reaction strategy game.",
        theme_color: "#6750A4",
        background_color: "#FEF7FF",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "grid-shock-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "grid-shock-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "grid-shock-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    open: true,
  },
});
