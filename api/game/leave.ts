import { getGame, setGame } from './game-store';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameId, playerId } = req.body;

  if (!gameId || !playerId) {
    return res.status(400).json({ error: 'Missing gameId or playerId' });
  }

  const state = await getGame(gameId);
  if (!state) {
    return res.status(404).json({ error: 'Game not found' });
  }

  state.abandoned = true;
  state.gameOver = true;

  await setGame(gameId, state);

  return res.status(200).json({ state });
}
