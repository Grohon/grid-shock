import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import type { IncomingMessage, ServerResponse } from "node:http";

/** Vite plugin that serves api/ routes during dev (no separate server needed) */
function apiRoutesPlugin() {
  const routes: Array<{ pattern: RegExp; method: string; modulePath: string; paramName?: string }> = [
    { pattern: /^\/game\/create$/, method: 'POST', modulePath: '/api/game/create.ts' },
    { pattern: /^\/game\/join$/, method: 'POST', modulePath: '/api/game/join.ts' },
    { pattern: /^\/game\/move$/, method: 'POST', modulePath: '/api/game/move.ts' },
    { pattern: /^\/game\/reset$/, method: 'POST', modulePath: '/api/game/reset.ts' },
    { pattern: /^\/game\/leave$/, method: 'POST', modulePath: '/api/game/leave.ts' },
    { pattern: /^\/game\/name$/, method: 'POST', modulePath: '/api/game/name.ts' },
    { pattern: /^\/game\/rooms$/, method: 'GET', modulePath: '/api/game/rooms.ts' },
    { pattern: /^\/game\/state$/, method: 'GET', modulePath: '/api/game/state.ts' },
  ];

  function polyfillVercelResponse(res: ServerResponse) {
    const r = res as any;
    if (!r.status) {
      r.status = (code: number) => { r.statusCode = code; return r; };
    }
    if (!r.json) {
      r.json = (data: unknown) => {
        r.setHeader('Content-Type', 'application/json');
        r.end(JSON.stringify(data));
      };
    }
  }

  function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      if (req.method !== 'POST' && req.method !== 'PUT') { resolve({}); return; }
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve(raw ? JSON.parse(raw) : {}); }
        catch { resolve({}); }
      });
    });
  }

  return {
    name: 'api-routes',
    configureServer(server: ViteDevServer) {
      // SPA fallback for room links in dev
      server.middlewares.use((req, _res, next) => {
        const url = req.url || '/';
        if (url.startsWith('/room/')) {
          req.url = '/';
        }
        next();
      });

      server.middlewares.use('/api', async (req, res, next) => {
        const fullUrl = req.url || '/';
        const qIdx = fullUrl.indexOf('?');
        const url = qIdx >= 0 ? fullUrl.slice(0, qIdx) : fullUrl;
        const method = req.method || 'GET';

        for (const route of routes) {
          const match = url.match(route.pattern);
          if (!match || route.method !== method) continue;

          try {
            polyfillVercelResponse(res);
            (req as any).body = await parseBody(req);
            const queryIdx = fullUrl.indexOf('?');
            const qs = queryIdx >= 0 ? fullUrl.slice(queryIdx + 1) : '';
            (req as any).query = Object.fromEntries(new URLSearchParams(qs));
            if (route.paramName && match[1]) {
              (req as any).query[route.paramName] = match[1];
            }

            const mod = await server.ssrLoadModule(route.modulePath);
            await mod.default(req, res);
            return;
          } catch (e) {
            console.error(`[api] ${method} ${url} failed:`, e);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
          }
        }

        next();
      });
    },
  } as any;
}

export default defineConfig({
  plugins: [
    react(),
    apiRoutesPlugin(),
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
