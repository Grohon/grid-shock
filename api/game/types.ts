export type PlayerID = 1 | 2 | 3 | 4;

export interface Cell {
  owner: PlayerID | null;
  count: number;
}

export type Board = Cell[][];

export interface GameState {
  board: Board;
  currentPlayer: PlayerID;
  mode: 'classic' | 'fixed';
  rows: number;
  cols: number;
  gameOver: boolean;
  winner?: PlayerID;
  vsComputer: boolean;
  computerPlayer?: PlayerID;
  numPlayers: number;
  gameId?: string;
  localPlayerId?: PlayerID;
  connectionStatus?: 'offline' | 'connecting' | 'waiting' | 'connected' | 'disconnected';
  playerNames: Record<PlayerID, string>;
  playerStats: { wins: number; losses: number };
  isOnline: boolean;
  initialPlaced: Record<PlayerID, boolean>;
  lastMove?: { x: number; y: number; player?: PlayerID };
  abandoned?: boolean;
  lastPoll?: Record<PlayerID, number>;
}
