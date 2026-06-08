import { getGame } from '../db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid game ID' });

  const state = await getGame(id);
  if (!state) return res.status(404).json({ error: 'Game not found' });

  return res.status(200).json({ state });
}
