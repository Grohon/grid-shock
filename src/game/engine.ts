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
    // We must clone the record to avoid mutating original state
    placedState.initialPlaced = { ...placedState.initialPlaced, [placedState.currentPlayer]: true };
  }


  const afterExplosions = resolveExplosions(placedState);
  const afterWin = checkWin(afterExplosions);

  if (!afterWin.gameOver) {
    afterWin.currentPlayer = afterWin.currentPlayer === 1 ? 2 : 1;
  }
  return afterWin;
}/** Evaluate a board state from a specific player's perspective */
function evaluateState(state: GameState, player: PlayerID): number {
  if (state.gameOver) {
    return state.winner === player ? 1000000 : -1000000;
  }

  const opponent = player === 1 ? 2 : 1;
  let score = 0;
  let ownedCells = 0;

  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const cell = state.board[r][c];
      const threshold = getThreshold(r, c, state);
      
      if (cell.owner === player) {
        ownedCells++;
        score += 100; 
        score += cell.count * 10;
        
        // Mode-specific strategic bonuses
        if (state.mode === 'classic') {
          if (threshold === 2) score += 30; // High value for corners in classic
          else if (threshold === 3) score += 15; // Edge value
        } else {
          // Fixed mode: Clustering bonus (encourage contiguous blocks)
          const dirs: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          for (const [dx, dy] of dirs) {
            const nr = r + dx;
            const nc = c + dy;
            if (inBounds(nr, nc, state) && state.board[nr][nc].owner === player) {
              score += 20; // Bonus for adjacent owned cells
            }
          }
        }

        if (cell.count === threshold - 1) {
          const dirs: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          let isVulnerable = false;
          for (const [dx, dy] of dirs) {
            const nr = r + dx;
            const nc = c + dy;
            if (inBounds(nr, nc, state)) {
              const neighbor = state.board[nr][nc];
              if (neighbor.owner === opponent && neighbor.count === getThreshold(nr, nc, state) - 1) {
                isVulnerable = true;
                break;
              }
            }
          }
          if (isVulnerable) score -= 150;
          else score += 50;
        }
      } else if (cell.owner === opponent) {
        score -= 100;
        score -= cell.count * 10;
        if (cell.count === threshold - 1) score += 20;
      } else {
        // Empty cells - weighted by strategic importance in Classic mode
        if (state.mode === 'classic') {
          if (threshold === 2) score += 40; 
          else if (threshold === 3) score += 20; 
        }
      }
    }
  }


  // If we own no cells in a non-gameover state, something is wrong with simulation
  if (ownedCells === 0) return -500000;

  return score;
}

/** Select a move for the computer player using Minimax with Alpha-Beta Pruning */
export function getComputerMove(state: GameState): [number, number] | null {
  const player = state.currentPlayer;
  const validMoves: Array<[number, number]> = [];
  
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      if (isValidMove(state.board[r][c], player, state)) {
        validMoves.push([r, c]);
      }
    }
  }

  if (validMoves.length === 0) return null;

  // Strategic move ordering: prioritize explosions to make Alpha-Beta pruning more effective
  validMoves.sort(([r1, c1], [r2, c2]) => {
    const thresh1 = getThreshold(r1, c1, state);
    const thresh2 = getThreshold(r2, c2, state);
    const isCrit1 = state.board[r1][c1].count >= thresh1 - 1 ? 1 : 0;
    const isCrit2 = state.board[r2][c2].count >= thresh2 - 1 ? 1 : 0;
    return isCrit2 - isCrit1;
  });

  let bestScore = -Infinity;
  let bestMoves: Array<[number, number]> = [];
  const depth = 3; // 3-step lookahead

  console.log(`[AI] Starting Minimax depth ${depth} search...`);
  const startTime = performance.now();

  for (const [r, c] of validMoves) {
    const nextState = makeMove(state, r, c);
    // After our move, it will be the opponent's turn (minimizing)
    const score = minimax(nextState, depth - 1, -Infinity, Infinity, false, player);
    
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [[r, c]];
    } else if (score === bestScore) {
      bestMoves.push([r, c]);
    }
  }

  const endTime = performance.now();
  const selected = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  console.log(`[AI] Search took ${(endTime - startTime).toFixed(0)}ms. Evaluated ${validMoves.length} base moves. Selected: [${selected[0]}, ${selected[1]}] Score: ${bestScore}`);
  
  return selected;
}

/** Minimax algorithm with Alpha-Beta pruning */
function minimax(
  state: GameState, 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizing: boolean, 
  aiPlayer: PlayerID
): number {
  // Base case: leaf node or terminal state
  if (depth === 0 || state.gameOver) {
    return evaluateState(state, aiPlayer);
  }

  const opponent = aiPlayer === 1 ? 2 : 1;
  const currentPlayer = isMaximizing ? aiPlayer : opponent;
  
  const validMoves: Array<[number, number]> = [];
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      if (isValidMove(state.board[r][c], currentPlayer, state)) {
        validMoves.push([r, c]);
      }
    }
  }

  if (validMoves.length === 0) return evaluateState(state, aiPlayer);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const [r, c] of validMoves) {
      const nextState = makeMove(state, r, c);
      const evalValue = minimax(nextState, depth - 1, alpha, beta, false, aiPlayer);
      maxEval = Math.max(maxEval, evalValue);
      alpha = Math.max(alpha, evalValue);
      if (beta <= alpha) break; // Pruning
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const [r, c] of validMoves) {
      const nextState = makeMove(state, r, c);
      const evalValue = minimax(nextState, depth - 1, alpha, beta, true, aiPlayer);
      minEval = Math.min(minEval, evalValue);
      beta = Math.min(beta, evalValue);
      if (beta <= alpha) break; // Pruning
    }
    return minEval;
  }
}




