export default async function handler(req, res) {
  res.status(200).json({ ok: true, url: process.env.UPSTASH_REDIS_REST_URL ? 'has-url' : 'no-url' });
}
