import { GameState, PlayerID, Cell } from './types';

/** Return a new GameState with the given modifications (shallow copy) */
function cloneState(state: GameState): GameState {
  // Deep clone board rows and cells
  const newBoard = state.board.map(row => row.map(cell => ({ ...cell })));
  return { ...state, board: newBoard };
}

/** Compute the threshold for a cell based on mode and position */
export function getThreshold(x: number, y: number, state: GameState): number {
  if (state.mode === 'fixed') return 4;
  let neighbors = 0;
  if (x > 0) neighbors++;
  if (x < state.rows - 1) neighbors++;
  if (y > 0) neighbors++;
  if (y < state.cols - 1) neighbors++;
  return neighbors;
}

/** Check if a move is allowed for the current player */
export function isValidMove(cell: Cell, player: PlayerID, state: GameState): boolean {
  // Classic mode follows original rule
  if (state.mode === 'classic') {
    return cell.owner === null || cell.owner === player;
  }
  // Fixed mode: allow placement on empty cell only for the player's first turn
  const hasPlaced = state.initialPlaced[player];
  if (!hasPlaced) {
    // First placement may be on an empty cell
    return cell.owner === null;
  }
  // After first placement, can only click on own cells
  return cell.owner === player;
}

/** Bounds checking */
export function inBounds(x: number, y: number, state: GameState): boolean {
  return x >= 0 && x < state.rows && y >= 0 && y < state.cols;
}

/** Resolve explosions until the board is stable, returning a new state */
export function resolveExplosions(state: GameState): GameState {
  const steps = getExplosionSteps(state);
  return steps[steps.length - 1];
}

/** Get all intermediate states of a chain reaction for animation */
export function getExplosionSteps(state: GameState): GameState[] {
  const steps: GameState[] = [];
  let current = cloneState(state);
  steps.push(cloneState(current));

  let safety = 0;
  while (safety < 100) {
    safety++;
    const nextState = cloneState(current);
    const toExplode: Array<[number, number]> = [];

    // Find all cells that meet the threshold in the current state
    for (let r = 0; r < nextState.rows; r++) {
      for (let c = 0; c < nextState.cols; c++) {
        if (nextState.board[r][c].count >= getThreshold(r, c, nextState)) {
          toExplode.push([r, c]);
        }
      }
    }

    if (toExplode.length === 0) break;

    // Execute all explosions for this "wave"
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

    // If game is over, stop early
    if (checkWin(current).gameOver) break;
  }

  return steps;
}



/** Check for a winner after all explosions have been resolved */
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
        return newState; // multiple owners – no winner yet
      }
    }
  }
  // Avoid declaring win after the very first move (only one owned cell)
  if (owner !== null && ownedCount > 1) {
    newState.gameOver = true;
    newState.winner = owner;
  }
  return newState;
}

/** Apply a move: validate, place atom, resolve, win check, switch player */
export function makeMove(state: GameState, x: number, y: number): GameState {
  const cell = state.board[x][y];
  if (!isValidMove(cell, state.currentPlayer, state)) return state; // illegal move ignored

  const placedState = cloneState(state);
  const targetCell = placedState.board[x][y];
  targetCell.count += 1;
  targetCell.owner = placedState.currentPlayer;

  // In fixed mode, record that this player has placed their initial block
  if (placedState.mode === 'fixed' && !placedState.initialPlaced[placedState.currentPlayer]) {
    placedState.initialPlaced[placedState.currentPlayer] = true;
  }

  const afterExplosions = resolveExplosions(placedState);
  const afterWin = checkWin(afterExplosions);

  if (!afterWin.gameOver) {
    afterWin.currentPlayer = afterWin.currentPlayer === 1 ? 2 : 1;
  }
  return afterWin;
}
