import { initGameState } from '../lib/engine.ts';
export default async function handler(req: any, res: any) {
  const state = initGameState(6, 6, 'classic', false, 2, 'test-1', undefined);
  return res.status(200).json({ ok: true, rows: state.rows });
}
