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
      if (d.result) return d.result;
    } catch {}
  }
  return MEMORY_STORE.get(id) || null;
}

async function getAllGameIds(): Promise<string[]> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const r = await fetch(`${UPSTASH_URL}/keys/game:*`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const d = await r.json();
      if (d.result) return d.result.map((k: string) => k.replace('game:', ''));
    } catch {}
  }
  return Array.from(MEMORY_STORE.keys());
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const gameIds = await getAllGameIds();
  const rooms: Array<{
    gameId: string; mode: string; rows: number; cols: number;
    numPlayers: number; filledSlots: number; hostName: string;
  }> = [];

  for (const id of gameIds) {
    const state = await getGame(id);
    if (!state || state.gameOver) continue;

    let filledSlots = 1;
    for (let i = 2; i <= state.numPlayers; i++) {
      if (state.initialPlaced[i] || state.playerNames[i] !== `Player ${i}`) filledSlots++;
    }
    if (filledSlots >= state.numPlayers) continue;

    rooms.push({
      gameId: id,
      mode: state.mode,
      rows: state.rows,
      cols: state.cols,
      numPlayers: state.numPlayers,
      filledSlots,
      hostName: state.playerNames[1],
    });
  }

  return res.status(200).json({ rooms });
}
