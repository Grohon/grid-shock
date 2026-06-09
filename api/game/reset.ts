import { getGame, setGame } from '../db.js';
import { broadcastAll } from '../ws-rooms.js';

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
  state.abandoned = false;
  state.initialPlaced = { 1: false, 2: false, 3: false, 4: false };
  state.lastMove = undefined;
  state.lastPoll = {};

  await setGame(gameId, state);
  broadcastAll(gameId, { type: 'state', state });
  return res.status(200).json({ state });
}
