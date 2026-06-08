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

function createBoard(rows: number, cols: number): any[][] {
  const board: any[] = [];
  for (let i = 0; i < rows; i++) {
    const row: any[] = [];
    for (let j = 0; j < cols; j++) row.push({ owner: null, count: 0 });
    board.push(row);
  }
  return board;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { gameId } = req.body;
  if (!gameId) return res.status(400).json({ error: 'Missing gameId' });

  const state = await getGame(gameId);
  if (!state) return res.status(404).json({ error: 'Game not found' });

  state.board = createBoard(state.rows, state.cols);
  state.currentPlayer = 1;
  state.gameOver = false;
  state.winner = undefined;
  state.initialPlaced = { 1: false, 2: false, 3: false, 4: false };
  state.lastMove = undefined;

  await setGame(gameId, state);
  return res.status(200).json({ state });
}
