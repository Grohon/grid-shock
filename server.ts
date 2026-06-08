import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { register, unregister, broadcastAll, getConnectedPlayerIds } from './api/ws-rooms.js';

const __dirname = import.meta.dirname || fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '');
const PORT = Number(process.env.PORT) || 3000;
const DIST = join(__dirname, 'dist');
const STATIC_EXTENSIONS = new Set(['.js', '.css', '.html', '.png', '.svg', '.ico', '.json', '.webmanifest']);

const MIME_TYPES: Record<string, string> = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

type ApiHandler = (req: any, res: any) => void | Promise<void>;

function polyfillResponse(res: ServerResponse) {
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

async function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  if (req.method !== 'POST' && req.method !== 'PUT') return {};
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

const API_ROUTES: Array<{ pattern: RegExp; method: string; path: string; paramName?: string }> = [
  { pattern: /^\/game\/create$/, method: 'POST', path: '/game/create.ts' },
  { pattern: /^\/game\/join$/, method: 'POST', path: '/game/join.ts' },
  { pattern: /^\/game\/move$/, method: 'POST', path: '/game/move.ts' },
  { pattern: /^\/game\/reset$/, method: 'POST', path: '/game/reset.ts' },
  { pattern: /^\/game\/leave$/, method: 'POST', path: '/game/leave.ts' },
  { pattern: /^\/game\/name$/, method: 'POST', path: '/game/name.ts' },
  { pattern: /^\/game\/rooms$/, method: 'GET', path: '/game/rooms.ts' },
  { pattern: /^\/game\/state$/, method: 'GET', path: '/game/state.ts' },
];

async function serveStatic(urlPath: string, res: ServerResponse): Promise<boolean> {
  let filePath = join(DIST, urlPath === '/' ? 'index.html' : urlPath);
  if (!existsSync(filePath)) {
    const alt = join(DIST, urlPath + '.html');
    if (existsSync(alt)) filePath = alt;
    else if (existsSync(join(DIST, 'index.html'))) filePath = join(DIST, 'index.html');
    else return false;
  }
  const ext = extname(filePath);
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': content.length });
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  try {
    const fullUrl = req.url || '/';
    const qIdx = fullUrl.indexOf('?');
    const urlPath = qIdx >= 0 ? fullUrl.slice(0, qIdx) : fullUrl;
    const method = req.method || 'GET';

    // API routes
    if (urlPath.startsWith('/api/')) {
      const apiPath = urlPath.replace('/api', '');
      for (const route of API_ROUTES) {
        const match = apiPath.match(route.pattern);
        if (!match || route.method !== method) continue;

        polyfillResponse(res);
        (req as any).body = await parseBody(req);
        const qs = qIdx >= 0 ? fullUrl.slice(qIdx + 1) : '';
        (req as any).query = Object.fromEntries(new URLSearchParams(qs));
        if (route.paramName && match[1]) {
          (req as any).query[route.paramName] = match[1];
        }

        const mod: { default: ApiHandler } = await import(`./api${route.path}`);
        await mod.default(req, res);
        return;
      }
    }

    // SPA: room links and other non-static routes → index.html
    if (urlPath.startsWith('/room/') || !STATIC_EXTENSIONS.has(extname(urlPath))) {
      const index = join(DIST, 'index.html');
      if (existsSync(index)) {
        const content = readFileSync(index);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
        return;
      }
    }

    // Static files
    if (await serveStatic(urlPath, res)) return;

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    console.error('[server]', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

const wss = new WebSocketServer({ noServer: true });

const ROOM_PATH_RE = /^\/ws\?gameId=([a-z]+-[a-z]+-\d{2})&playerId=(\d+)$/;

server.on('upgrade', (req, socket, head) => {
  const url = req.url || '';
  const match = url.match(ROOM_PATH_RE);
  if (!match) return;

  wss.handleUpgrade(req, socket, head, (ws) => {
    const gameId = match[1];
    const playerId = Number(match[2]);
    register(gameId, playerId, ws);

    ws.on('close', async () => {
      unregister(gameId, playerId);
      const remaining = getConnectedPlayerIds(gameId);
      if (remaining.length > 0) {
        broadcastAll(gameId, { type: 'abandon' });
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
