import { getGame, setGame } from '../lib/game-store.ts';
export default async function handler(req: any, res: any) {
  return res.status(200).json({ ok: true, store: !!getGame });
}
