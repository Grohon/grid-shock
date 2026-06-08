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

function getThreshold(x: number, y: number, state: any): number {
  if (state.mode === 'fixed') return 4;
  let n = 0;
  if (x > 0) n++;
  if (x < state.rows - 1) n++;
  if (y > 0) n++;
  if (y < state.cols - 1) n++;
  return n;
}

function isValidMove(cell: any, player: number, state: any): boolean {
  if (state.mode === 'classic') return cell.owner === null || cell.owner === player;
  if (!state.initialPlaced[player]) return cell.owner === null;
  return cell.owner === player;
}

function inBounds(x: number, y: number, state: any): boolean {
  return x >= 0 && x < state.rows && y >= 0 && y < state.cols;
}

function cloneState(state: any): any {
  return { ...state, board: state.board.map((row: any[]) => row.map((c: any) => ({ ...c }))) };
}

function checkWin(state: any): any {
  const ns = cloneState(state);
  let owner: number | null = null;
  let ownedCount = 0;
  for (const row of ns.board) {
    for (const cell of row) {
      if (cell.owner === null) continue;
      ownedCount++;
      if (owner === null) owner = cell.owner;
      else if (owner !== cell.owner) return ns;
    }
  }
  if (owner !== null && ownedCount > 1) { ns.gameOver = true; ns.winner = owner; }
  return ns;
}

function getExplosionSteps(state: any): any[] {
  const steps: any[] = [];
  let current = cloneState(state);
  steps.push(cloneState(current));
  let safety = 0;
  while (safety < 100) {
    safety++;
    const nextState = cloneState(current);
    const toExplode: Array<[number, number]> = [];
    for (let r = 0; r < nextState.rows; r++)
      for (let c = 0; c < nextState.cols; c++)
        if (nextState.board[r][c].count >= getThreshold(r, c, nextState))
          toExplode.push([r, c]);
    if (toExplode.length === 0) break;
    for (const [x, y] of toExplode) {
      const cell = nextState.board[x][y];
      const th = getThreshold(x, y, nextState);
      cell.count -= th;
      if (cell.count === 0) cell.owner = null;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy;
        if (inBounds(nx, ny, nextState)) {
          nextState.board[nx][ny].count += 1;
          nextState.board[nx][ny].owner = current.currentPlayer;
        }
      }
    }
    current = nextState;
    steps.push(cloneState(current));
    if (checkWin(current).gameOver) break;
  }
  return steps;
}

function resolveExplosions(state: any): any {
  const steps = getExplosionSteps(state);
  return steps[steps.length - 1];
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { gameId, playerId, x, y } = req.body;
  if (!gameId || !playerId || x === undefined || y === undefined)
    return res.status(400).json({ error: 'Missing required fields' });

  const state = await getGame(gameId);
  if (!state) return res.status(404).json({ error: 'Game not found' });
  if (state.gameOver) return res.status(400).json({ error: 'Game is already over' });
  if (state.currentPlayer !== playerId) return res.status(400).json({ error: 'Not your turn' });

  const cell = state.board[x]?.[y];
  if (!cell) return res.status(400).json({ error: 'Invalid cell position' });
  if (!isValidMove(cell, playerId, state)) return res.status(400).json({ error: 'Invalid move' });

  state.board = state.board.map((row: any[]) => row.map((c: any) => ({ ...c })));
  const target = state.board[x][y];
  target.count += 1;
  target.owner = playerId;
  state.lastMove = { x, y, player: playerId };

  if (!state.initialPlaced[playerId]) state.initialPlaced = { ...state.initialPlaced, [playerId]: true };

  const after = resolveExplosions(state);
  const afterWin = checkWin(after);
  afterWin.lastMove = { x, y, player: playerId };

  if (!afterWin.gameOver) {
    let nextPlayer = (afterWin.currentPlayer % afterWin.numPlayers + 1);
    let attempts = 0;
    while (attempts < 4) {
      const hasPlaced = afterWin.initialPlaced[nextPlayer];
      const ownsCells = afterWin.board.some((row: any[]) => row.some((c: any) => c.owner === nextPlayer));
      if (!hasPlaced || ownsCells) { afterWin.currentPlayer = nextPlayer; break; }
      nextPlayer = (nextPlayer % afterWin.numPlayers + 1);
      attempts++;
    }
  }

  await setGame(gameId, afterWin);
  return res.status(200).json({ state: afterWin });
}
