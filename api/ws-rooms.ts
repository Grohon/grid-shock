import { WebSocket } from 'ws';

const STORE_KEY = '__grid_shock_rooms__';
function getStore(): Map<string, Map<number, WebSocket>> {
  if (!(globalThis as any)[STORE_KEY]) {
    (globalThis as any)[STORE_KEY] = new Map();
  }
  return (globalThis as any)[STORE_KEY];
}

export function register(gameId: string, playerId: number, ws: WebSocket) {
  const store = getStore();
  let room = store.get(gameId);
  if (!room) {
    room = new Map();
    store.set(gameId, room);
  }
  room.set(playerId, ws);
}

export function unregister(gameId: string, playerId: number) {
  const store = getStore();
  const room = store.get(gameId);
  if (!room) return;
  room.delete(playerId);
  if (room.size === 0) store.delete(gameId);
}

export function broadcast(gameId: string, data: object) {
  const store = getStore();
  const room = store.get(gameId);
  if (!room) return;
  const msg = JSON.stringify(data);
  for (const ws of room.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

export function broadcastAll(gameId: string, data: object) {
  const store = getStore();
  const room = store.get(gameId);
  if (!room) return;
  const msg = JSON.stringify(data);
  for (const ws of room.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

export function getPlayerCount(gameId: string): number {
  return getStore().get(gameId)?.size ?? 0;
}

export function isPlayerConnected(gameId: string, playerId: number): boolean {
  return getStore().get(gameId)?.has(playerId) ?? false;
}

export function getConnectedPlayerIds(gameId: string): number[] {
  return Array.from(getStore().get(gameId)?.keys() ?? []);
}
