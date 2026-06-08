const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const MEMORY_STORE = new Map<string, any>();

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid game ID' });

  const state = await getGame(id);
  if (!state) return res.status(404).json({ error: 'Game not found' });

  return res.status(200).json({ state });
}
