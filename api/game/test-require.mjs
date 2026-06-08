import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default async function handler(req, res) {
  const shared = require('./shared.js');
  const state = shared.initGameState(6, 6, 'classic');
  res.status(200).json({ ok: true, rows: state.rows });
}
