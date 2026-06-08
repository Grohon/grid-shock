const MEMORY = new Map();

export default async function handler(req: any, res: any) {
  MEMORY.set('test', { ts: Date.now() });
  const val = MEMORY.get('test');
  return res.status(200).json({ ok: true, val });
}
