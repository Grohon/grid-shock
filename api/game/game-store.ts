import type { GameState } from './types';

const MEMORY_STORE = new Map<string, GameState>();
let kvClient: {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  keys: (pattern?: string) => Promise<string[]>;
} | null = null;

async function initKv() {
  if (kvClient !== undefined) return;
  try {
    const { Redis } = await import('@upstash/redis');
    kvClient = Redis.fromEnv() as any;
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
    return (await kvClient.get(`game:${id}`) as GameState | undefined) || null;
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
