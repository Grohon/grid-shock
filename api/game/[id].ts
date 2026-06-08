import type { PlayerID } from './types';
import { getGame, setGame } from './game-store';

const STALE_MS = 10_000;

export default async function handler(req: any, res: any) {
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
    const prev = state.lastPoll ?? {} as Record<PlayerID, number>;
    state.lastPoll = { ...prev, [pid]: now };

    const onlinePlayers = Object.keys(prev).filter(k => Number(k) !== pid);
    for (const key of onlinePlayers) {
      const last = prev[Number(key) as PlayerID];
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
