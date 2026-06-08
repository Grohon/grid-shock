import type { GameState, PlayerID, Cell, Board } from './types';

export function createBoard(rows: number, cols: number): Board {
  const board: Board = [];
  for (let i = 0; i < rows; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < cols; j++) {
      row.push({ owner: null, count: 0 });
    }
    board.push(row);
  }
  return board;
}

export function initGameState(
  rows: number, cols: number, mode: 'classic' | 'fixed',
  vsComputer: boolean, numPlayers: number,
  gameId?: string, playerNames?: Record<PlayerID, string>,
): GameState {
  return {
    board: createBoard(rows, cols),
    currentPlayer: 1 as PlayerID,
    mode,
    rows,
    cols,
    numPlayers,
    gameOver: false,
    winner: undefined,
    vsComputer: vsComputer && numPlayers === 2,
    computerPlayer: (vsComputer && numPlayers === 2) ? 2 : undefined,
    gameId,
    isOnline: !!gameId,
    playerNames: playerNames || { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3', 4: 'Player 4' },
    playerStats: { wins: 0, losses: 0 },
    initialPlaced: { 1: false, 2: false, 3: false, 4: false },
    lastMove: undefined,
  };
}

function cloneState(state: GameState): GameState {
  const newBoard = state.board.map(row => row.map(cell => ({ ...cell })));
  return { ...state, board: newBoard };
}

function getThreshold(x: number, y: number, state: GameState): number {
  if (state.mode === 'fixed') return 4;
  let neighbors = 0;
  if (x > 0) neighbors++;
  if (x < state.rows - 1) neighbors++;
  if (y > 0) neighbors++;
  if (y < state.cols - 1) neighbors++;
  return neighbors;
}

export function isValidMove(cell: Cell, player: PlayerID, state: GameState): boolean {
  if (state.mode === 'classic') {
    return cell.owner === null || cell.owner === player;
  }
  const hasPlaced = state.initialPlaced[player];
  if (!hasPlaced) {
    return cell.owner === null;
  }
  return cell.owner === player;
}

function inBounds(x: number, y: number, state: GameState): boolean {
  return x >= 0 && x < state.rows && y >= 0 && y < state.cols;
}

export function resolveExplosions(state: GameState): GameState {
  const steps = getExplosionSteps(state);
  return steps[steps.length - 1];
}

function getExplosionSteps(state: GameState): GameState[] {
  const steps: GameState[] = [];
  let current = cloneState(state);
  steps.push(cloneState(current));

  let safety = 0;
  while (safety < 100) {
    safety++;
    const nextState = cloneState(current);
    const toExplode: Array<[number, number]> = [];

    for (let r = 0; r < nextState.rows; r++) {
      for (let c = 0; c < nextState.cols; c++) {
        if (nextState.board[r][c].count >= getThreshold(r, c, nextState)) {
          toExplode.push([r, c]);
        }
      }
    }

    if (toExplode.length === 0) break;

    for (const [x, y] of toExplode) {
      const cell = nextState.board[x][y];
      const threshold = getThreshold(x, y, nextState);
      cell.count -= threshold;
      if (cell.count === 0) cell.owner = null;

      const dirs: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (inBounds(nx, ny, nextState)) {
          const neighbor = nextState.board[nx][ny];
          neighbor.count += 1;
          neighbor.owner = current.currentPlayer;
        }
      }
    }

    current = nextState;
    steps.push(cloneState(current));

    if (checkWin(current).gameOver) break;
  }

  return steps;
}

export function checkWin(state: GameState): GameState {
  const newState = cloneState(state);
  let owner: PlayerID | null = null;
  let ownedCount = 0;
  for (const row of newState.board) {
    for (const cell of row) {
      if (cell.owner === null) continue;
      ownedCount++;
      if (owner === null) {
        owner = cell.owner;
      } else if (owner !== cell.owner) {
        return newState;
      }
    }
  }
  if (owner !== null && ownedCount > 1) {
    newState.gameOver = true;
    newState.winner = owner;
  }
  return newState;
}
