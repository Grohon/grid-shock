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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { gameId, playerName } = req.body;
  if (!gameId) return res.status(400).json({ error: 'Missing gameId' });

  const state = await getGame(gameId);
  if (!state) return res.status(404).json({ error: 'Room not found' });
  if (state.gameOver) return res.status(400).json({ error: 'Game is already over' });

  let playerId: number | null = null;
  for (let i = 2; i <= state.numPlayers; i++) {
    if (!state.initialPlaced[i]) {
      if (state.playerNames[i] === `Player ${i}`) { playerId = i; break; }
    }
    const ownsCells = state.board.some((row: any[]) => row.some((c: any) => c.owner === i));
    if (ownsCells) continue;
    if (!state.initialPlaced[i]) { playerId = i; break; }
  }

  if (!playerId) {
    if (!state.initialPlaced[2] || state.board.some((row: any[]) => row.some((c: any) => c.owner === 2)))
      return res.status(400).json({ error: 'Room is full' });
    playerId = 2;
  }

  state.playerNames = { ...state.playerNames, [playerId]: playerName || `Player ${playerId}` };
  await setGame(gameId, state);
  return res.status(200).json({ playerId, state: { ...state, localPlayerId: playerId } });
}
