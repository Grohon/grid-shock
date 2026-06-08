import type { GameState } from '../../src/game/types';

const MEMORY_STORE = new Map<string, GameState>();
let kvClient: { get: (...args: unknown[]) => Promise<unknown>; set: (...args: unknown[]) => Promise<void>; del: (...args: unknown[]) => Promise<void>; keys: (...args: unknown[]) => Promise<string[]> } | null = null;

async function initKv() {
  if (kvClient !== undefined) return;
  try {
    const mod = await import('@vercel/kv');
    kvClient = mod.kv;
  } catch {
    kvClient = null;
  }
}

export async function getAllGameIds(): Promise<string[]> {
  await initKv();
  if (kvClient) {
    const keys: string[] = await kvClient.keys('game:*');
    return keys.map((k: string) => k.replace('game:', ''));
  }
  return Array.from(MEMORY_STORE.keys());
}

export async function getGame(id: string): Promise<GameState | null> {
  await initKv();
  if (kvClient) {
    return (await kvClient.get(`game:${id}`)) || null;
  }
  return MEMORY_STORE.get(id) || null;
}

export async function setGame(id: string, state: GameState): Promise<void> {
  await initKv();
  if (kvClient) {
    await kvClient.set(`game:${id}`, state);
  }
  MEMORY_STORE.set(id, state);
}

export async function deleteGame(id: string): Promise<void> {
  await initKv();
  if (kvClient) {
    await kvClient.del(`game:${id}`);
  }
  MEMORY_STORE.delete(id);
}
