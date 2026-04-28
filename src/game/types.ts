/**
 * Core type definitions for the Color Wars game.
 */
export type PlayerID = 1 | 2;

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
  // Tracks whether each player has placed their initial block in fixed mode
  initialPlaced: Record<PlayerID, boolean>;
}

