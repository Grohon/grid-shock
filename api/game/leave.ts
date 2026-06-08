import { getGame, setGame, removeGameIndex } from '../db.js';
import { broadcast } from '../ws-rooms.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { gameId } = req.body;
  if (!gameId) return res.status(400).json({ error: 'Missing gameId' });

  const state = await getGame(gameId);
  if (!state) return res.status(404).json({ error: 'Game not found' });

  state.abandoned = true;
  state.gameOver = true;
  await setGame(gameId, state);
  await removeGameIndex(gameId);
  broadcast(gameId, { type: 'abandon' });
  return res.status(200).json({ state });
}
