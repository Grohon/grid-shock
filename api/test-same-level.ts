import { getGame } from './lib/game-store';
export default async function handler(req: any, res: any) {
  return res.status(200).json({ ok: true, note: 'imported from api/lib' });
}
