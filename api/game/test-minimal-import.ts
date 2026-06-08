import { initGameState } from './test-minimal-engine';
export default async function handler(req: any, res: any) {
  const state = initGameState(6, 6, 'classic');
  return res.status(200).json({ ok: true, rows: state.rows });
}
