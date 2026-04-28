import { create } from 'zustand';

import { GameState, PlayerID, Cell, Board } from './types';
import { makeMove, getThreshold, isValidMove, getExplosionSteps, checkWin, getComputerMove } from './engine';

/** Helper to create an empty board */
function createBoard(rows: number, cols: number): Board {
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

interface GameStore {
  state: GameState;
  isAnimating: boolean;
  initGame: (rows: number, cols: number, mode: 'classic' | 'fixed', vsComputer: boolean) => void;
  attemptMove: (x: number, y: number) => Promise<void>;
  resetGame: () => void;
}



export const useGameStore = create<GameStore>((set, get) => ({
  state: {
    board: [],
    currentPlayer: 1 as PlayerID,
    mode: 'classic',
    rows: 0,
    cols: 0,
    gameOver: false,
    winner: undefined,
  },
  isAnimating: false,
  initGame: (rows, cols, mode, vsComputer) => {
    // Defensive clamping
    const r = Math.max(3, Math.min(10, rows));
    const c = Math.max(3, Math.min(10, cols));

    const board = createBoard(r, c);
    const startPlayer = (vsComputer && Math.random() > 0.5) ? 2 : 1;
    
    const newState: GameState = {
      board,
      currentPlayer: startPlayer as PlayerID,
      mode,
      rows: r,
      cols: c,
      gameOver: false,
      winner: undefined,
      vsComputer,
      computerPlayer: vsComputer ? 2 : undefined,
      initialPlaced: { 1: false, 2: false },
    };

    set({ isAnimating: false, state: newState });

    // Trigger computer move if it starts first
    if (vsComputer && startPlayer === 2) {
      setTimeout(async () => {
        const currentStore = useGameStore.getState();
        if (currentStore.isAnimating || currentStore.state.gameOver) return;
        const move = getComputerMove(currentStore.state);
        if (move) await currentStore.attemptMove(move[0], move[1]);
      }, 800);
    }
  },
  attemptMove: async (x, y) => {
    const { state, isAnimating } = get();
    if (state.gameOver || isAnimating) return;

    const cell = state.board[x][y];
    if (!isValidMove(cell, state.currentPlayer, state)) return;

    set({ isAnimating: true });

    // 1. Initial placement
    const placedState = { ...state, board: state.board.map(row => row.map(c => ({ ...c }))) };
    const targetCell = placedState.board[x][y];
    targetCell.count += 1;
    targetCell.owner = placedState.currentPlayer;

    if (placedState.mode === 'fixed' && !placedState.initialPlaced[placedState.currentPlayer]) {
      // We must clone the record to avoid mutating original state
      placedState.initialPlaced = { ...placedState.initialPlaced, [placedState.currentPlayer]: true };
    }

    set({ state: placedState });

    // 2. Resolve explosions in steps
    const steps = getExplosionSteps(placedState);
    
    // The first step is the placed state, so we start from the second step
    for (let i = 1; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ state: steps[i] });
    }

    // 3. Finalize turn (win check and player switch)
    const finalState = { ...get().state };
    const afterWin = checkWin(finalState);
    
    if (!afterWin.gameOver) {
      afterWin.currentPlayer = afterWin.currentPlayer === 1 ? 2 : 1;
    }
    
    set({ state: afterWin, isAnimating: false });

    // 4. Trigger Computer turn if needed
    if (!afterWin.gameOver && afterWin.vsComputer && afterWin.currentPlayer === afterWin.computerPlayer) {
      // Small delay to ensure React/Zustand state has flushed
      setTimeout(async () => {
        const currentStore = useGameStore.getState();
        if (currentStore.isAnimating || currentStore.state.gameOver) return;
        
        const move = getComputerMove(currentStore.state);
        if (move) {
          await currentStore.attemptMove(move[0], move[1]);
        }
      }, 600);
    }

  },

  resetGame: () => {
    const { rows, cols, mode, vsComputer } = get().state;
    const board = createBoard(rows, cols);
    const startPlayer = (vsComputer && Math.random() > 0.5) ? 2 : 1;

    const newState: GameState = {
      board,
      currentPlayer: startPlayer as PlayerID,
      mode,
      rows,
      cols,
      gameOver: false,
      winner: undefined,
      vsComputer,
      computerPlayer: vsComputer ? 2 : undefined,
      initialPlaced: { 1: false, 2: false },
    };

    set({ isAnimating: false, state: newState });

    // Trigger computer move if it starts first
    if (vsComputer && startPlayer === 2) {
      setTimeout(async () => {
        const currentStore = useGameStore.getState();
        if (currentStore.isAnimating || currentStore.state.gameOver) return;
        const move = getComputerMove(currentStore.state);
        if (move) await currentStore.attemptMove(move[0], move[1]);
      }, 800);
    }
  },

  // Clear all state to go back to setup screen
  clearGame: () => {
    set({
      state: {
        board: [],
        currentPlayer: 1 as PlayerID,
        mode: 'classic',
        rows: 0,
        cols: 0,
        gameOver: false,
        winner: undefined,
        initialPlaced: { 1: false, 2: false },
      },
    });
  },
  // Update mode without resetting the board (used for settings mid‑game)
  setMode: (mode: 'classic' | 'fixed') => {
    set(state => ({
      state: { ...state.state, mode },
    }));
  },
}));
