import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGame } from '../lib/game-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid game ID' });
  }

  const state = await getGame(id);

  if (!state) {
    return res.status(404).json({ error: 'Game not found' });
  }

  return res.status(200).json({ state });
}
