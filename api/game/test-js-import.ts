import { initGameState } from './shared.js';
export default async function handler(req: any, res: any) {
  const state = initGameState(6, 6, 'classic');
  return res.status(200).json({ ok: true, rows: state.rows });
}
