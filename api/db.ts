const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const STORE_KEY = '__grid_shock_db__';

function getMemoryStore(): Map<string, any> {
  if (!(globalThis as any)[STORE_KEY]) {
    (globalThis as any)[STORE_KEY] = new Map();
  }
  return (globalThis as any)[STORE_KEY];
}

export async function getGame(id: string) {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const r = await fetch(`${UPSTASH_URL}/get/game:${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const d = await r.json();
      if (d.result) return typeof d.result === 'string' ? JSON.parse(d.result) : d.result;
    } catch {}
  }
  return getMemoryStore().get(id) || null;
}

export async function setGame(id: string, state: any) {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      await fetch(`${UPSTASH_URL}/set/game:${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
    } catch {}
  }
  getMemoryStore().set(id, state);
}

export async function getAllGameIds(): Promise<string[]> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const r = await fetch(`${UPSTASH_URL}/get/game:index`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const d = await r.json();
      const parsed = typeof d.result === 'string' ? JSON.parse(d.result) : d.result;
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return Array.from(getMemoryStore().keys());
}

export async function addGameIndex(gameId: string) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  try {
    const r = await fetch(`${UPSTASH_URL}/get/game:index`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    const d = await r.json();
    const raw = typeof d.result === 'string' ? JSON.parse(d.result) : d.result;
    const idx: string[] = Array.isArray(raw) ? raw : [];
    if (!idx.includes(gameId)) idx.push(gameId);
    await fetch(`${UPSTASH_URL}/set/game:index`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(idx),
    });
  } catch {}
}

export async function removeGameIndex(gameId: string) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  try {
    const r = await fetch(`${UPSTASH_URL}/get/game:index`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    const d = await r.json();
    const raw = typeof d.result === 'string' ? JSON.parse(d.result) : d.result;
    const idx: string[] = (Array.isArray(raw) ? raw : []).filter((g: string) => g !== gameId);
    await fetch(`${UPSTASH_URL}/set/game:index`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(idx),
    });
  } catch {}
}
