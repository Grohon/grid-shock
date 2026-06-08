import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PlayerID } from '../../src/game/types';
import { getGame, setGame } from '../lib/game-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameId, playerId, name } = req.body;

  if (!gameId || !playerId || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const state = await getGame(gameId);
  if (!state) {
    return res.status(404).json({ error: 'Game not found' });
  }

  state.playerNames = {
    ...state.playerNames,
    [playerId as PlayerID]: name,
  };

  await setGame(gameId, state);

  return res.status(200).json({ success: true });
}
