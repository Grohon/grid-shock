import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initGameState } from '../../src/game/engine';
import { setGame } from '../lib/game-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode, rows, cols, numPlayers, playerName } = req.body;

  if (!mode || !rows || !cols || !numPlayers) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['classic', 'fixed'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  const r = Math.max(3, Math.min(10, rows));
  const c = Math.max(3, Math.min(10, cols));
  const n = Math.max(2, Math.min(4, numPlayers));

  const gameId = Math.floor(Math.random() * 900000 + 100000).toString();
  const playerNames = {
    1: (playerName as string) || 'Player 1',
    2: 'Player 2',
    3: 'Player 3',
    4: 'Player 4',
  } as Record<1 | 2 | 3 | 4, string>;

  const state = initGameState(r, c, mode, false, n, gameId, playerNames);
  state.currentPlayer = 1;

  await setGame(gameId, state);

  return res.status(200).json({
    gameId: state.gameId,
    playerId: 1,
    state: { ...state, localPlayerId: 1 },
  });
}
