const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const MEMORY_STORE = new Map<string, any>();
const STALE_MS = 10_000;

async function getGame(id: string) {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const r = await fetch(`${UPSTASH_URL}/get/game:${id}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const d = await r.json();
      if (d.result) return typeof d.result === 'string' ? JSON.parse(d.result) : d.result;
    } catch {}
  }
  return MEMORY_STORE.get(id) || null;
}

async function setGame(id: string, state: any) {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      await fetch(`${UPSTASH_URL}/set/game:${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
    } catch {}
  }
  MEMORY_STORE.set(id, state);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id, playerId } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid game ID' });

  const state = await getGame(id);
  if (!state) return res.status(404).json({ error: 'Game not found' });

  if (playerId && !Array.isArray(playerId)) {
    const pid = Number(playerId);
    const now = Date.now();
    if (!state.lastPoll) state.lastPoll = {};
    const prev = state.lastPoll;
    state.lastPoll[pid] = now;

    for (const key of Object.keys(prev)) {
      const k = Number(key);
      if (k === pid) continue;
      if (prev[k] && (now - prev[k]) > STALE_MS) {
        state.abandoned = true;
        state.gameOver = true;
        // Remove from game index
        if (UPSTASH_URL && UPSTASH_TOKEN) {
          try {
            const r = await fetch(`${UPSTASH_URL}/get/game:index`, {
              headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
            });
            const d = await r.json();
            const raw = typeof d.result === 'string' ? JSON.parse(d.result) : d.result;
            const idx: string[] = (Array.isArray(raw) ? raw : []).filter((g: string) => g !== id);
            await fetch(`${UPSTASH_URL}/set/game:index`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(idx),
            });
          } catch {}
        }
        break;
      }
    }

    await setGame(id, state);
  }

  return res.status(200).json({ state });
}
