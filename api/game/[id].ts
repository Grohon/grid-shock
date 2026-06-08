import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PlayerID } from '../../src/game/types';
import { getGame, setGame } from '../lib/game-store';

const STALE_MS = 10_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, playerId } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid game ID' });
  }

  const state = await getGame(id);

  if (!state) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (playerId && !Array.isArray(playerId)) {
    const pid = Number(playerId) as PlayerID;
    const now = Date.now();
    state.lastPoll = { ...state.lastPoll, [pid]: now };

    // Check if any other player went stale
    const onlinePlayers = Object.keys(state.lastPoll).filter(k => Number(k) !== pid);
    for (const key of onlinePlayers) {
      const last = state.lastPoll![Number(key) as PlayerID];
      if (last && (now - last) > STALE_MS) {
        state.abandoned = true;
        state.gameOver = true;
        break;
      }
    }

    await setGame(id, state);
  }

  return res.status(200).json({ state });
}
