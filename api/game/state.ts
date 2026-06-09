import { getGame, setGame } from '../db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id, playerId } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid game ID' });

  const state = await getGame(id);
  if (!state) return res.status(404).json({ error: 'Game not found' });

  // Track this player's poll timestamp for disconnect detection
  if (playerId && !Array.isArray(playerId)) {
    const pid = Number(playerId);
    if (pid >= 1 && pid <= 4) {
      state.lastPoll = state.lastPoll || {};
      state.lastPoll[pid] = Date.now();

      // Check if any other player has stale poll (>10s)
      if (!state.abandoned) {
        let staleDetected = false;
        for (let i = 1; i <= (state.numPlayers || 2); i++) {
          if (i !== pid && state.lastPoll[i] && Date.now() - state.lastPoll[i] > 10000) {
            staleDetected = true;
            break;
          }
        }
        if (staleDetected) {
          state.abandoned = true;
          state.gameOver = true;
          await setGame(id, state);
        }
      }
    }
  }

  return res.status(200).json({ state });
}
