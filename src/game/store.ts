import { create } from 'zustand';

import { GameState, PlayerID } from './types';
import { createBoard, getExplosionSteps, checkWin, getComputerMove, isValidMove } from './engine';
import { playClick, playExplosion, playWin, playLose } from './lib/sound';

const API_BASE = '/api';

interface GameStore {
  state: GameState;
  isAnimating: boolean;
  initGame: (rows: number, cols: number, mode: 'classic' | 'fixed', vsComputer: boolean, numPlayers: number, gameId?: string, localPlayerId?: PlayerID, isOnline?: boolean, serverState?: GameState) => void;
  attemptMove: (x: number, y: number, isRemote?: boolean) => Promise<void>;
  resetGame: (isRemote?: boolean) => void;
  clearGame: () => void;
  setPlayerName: (playerId: PlayerID, name: string) => void;
  setMode: (mode: 'classic' | 'fixed') => void;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const startPolling = (gameId: string, localPlayerId: PlayerID) => {
  stopPolling();
  let prevMoveKey = '';
  pollTimer = setInterval(async () => {
    const store = useGameStore.getState();
    if (!store.state.isOnline) {
      stopPolling();
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/game/state?id=${gameId}&playerId=${localPlayerId}`);
      if (!res.ok) return;
      const data = await res.json();
      const serverState = data.state as GameState;
      const localState = store.state;
      const moveKey = serverState.lastMove ? `${serverState.lastMove.x},${serverState.lastMove.y}` : '';

      const serverReset = !serverState.lastMove && localState.lastMove;
      const gameOverChanged = localState.gameOver !== serverState.gameOver;
      const abandonedChanged = serverState.abandoned && !localState.abandoned;

      const isNewMove = moveKey && moveKey !== prevMoveKey;

      if (isNewMove || serverReset || gameOverChanged || abandonedChanged) {
        if (isNewMove) {
          const { x: mx, y: my, player: movingPlayer } = serverState.lastMove!;

          if (movingPlayer && movingPlayer !== localPlayerId) {
            const prevBoard = localState.board;
            const placedBoard = prevBoard.map(row => row.map(c => ({ ...c })));
            if (placedBoard[mx]?.[my]) {
              placedBoard[mx][my].count += 1;
              placedBoard[mx][my].owner = movingPlayer;
            }
            const placedState: GameState = {
              ...localState,
              board: placedBoard,
              playerNames: serverState.playerNames,
              lastMove: { x: mx, y: my },
              initialPlaced: { ...localState.initialPlaced, [movingPlayer]: true },
            };
            const steps = getExplosionSteps(placedState);
            for (let i = 1; i < steps.length; i++) {
              await new Promise(r => setTimeout(r, 500));
              useGameStore.setState({
              state: {
                ...steps[i],
                localPlayerId,
                isOnline: true,
                playerStats: localState.playerStats,
                playerNames: steps[i].playerNames,
              }
              });
            }
          }
        }

        if (isNewMove) prevMoveKey = moveKey;
        if (serverReset) prevMoveKey = '';

        // Sync to authoritative server state
        useGameStore.setState({
          state: {
            ...serverState,
            localPlayerId,
            isOnline: true,
            playerStats: store.state.playerStats,
            playerNames: serverState.playerNames,
          }
        });
      } else {
        // No state change — sync player names from server
        if (JSON.stringify(serverState.playerNames) !== JSON.stringify(store.state.playerNames)) {
          useGameStore.setState({
            state: { ...store.state, playerNames: serverState.playerNames }
          });
        }
      }
    } catch {
      // Silently retry on next poll
    }
  }, 1000);
};

export const useGameStore = create<GameStore>((set, get) => ({
  state: {
    board: [],
    currentPlayer: 1 as PlayerID,
    mode: 'classic',
    rows: 0,
    cols: 0,
    numPlayers: 2,
    gameOver: false,
    winner: undefined,
    vsComputer: false,
    initialPlaced: { 1: false, 2: false, 3: false, 4: false },
    playerNames: JSON.parse(localStorage.getItem('gs_playerNames') || '{"1":"Player 1","2":"Player 2","3":"Player 3","4":"Player 4"}'),
    playerStats: JSON.parse(localStorage.getItem('gs_stats') || '{"wins":0, "losses":0}'),
    isOnline: false,
    lastMove: undefined,
  },
  isAnimating: false,

  initGame: (rows, cols, mode, vsComputer, numPlayers = 2, gameId?: string, localPlayerId?: PlayerID, isOnline = false, serverState?: GameState) => {
    stopPolling();
    const storedStats = JSON.parse(localStorage.getItem('gs_stats') || '{"wins":0, "losses":0}');
    const storedNames = JSON.parse(localStorage.getItem('gs_playerNames') || '{"1":"Player 1","2":"Player 2","3":"Player 3","4":"Player 4"}');

    if (serverState && isOnline) {
      const localId = (localPlayerId || serverState.localPlayerId || 1) as PlayerID;
      const newState: GameState = {
        ...serverState,
        localPlayerId: localId,
        playerStats: storedStats,
        playerNames: serverState.playerNames,
        isOnline: true,
      };
      set({ isAnimating: false, state: newState });
      startPolling(gameId || serverState.gameId || '', localId);
      sessionStorage.setItem('gs_session', JSON.stringify({
        gameId: gameId || serverState.gameId,
        playerId: localId,
        isOnline: true,
      }));
      return;
    }

    const r = Math.max(3, Math.min(10, rows));
    const c = Math.max(3, Math.min(10, cols));
    const localId = isOnline ? (localPlayerId || 1) : undefined;

    const playerNames = isOnline
      ? { 1: storedNames[(localPlayerId || 1) as PlayerID] || `Player ${localPlayerId || 1}`, 2: 'Player 2', 3: 'Player 3', 4: 'Player 4' }
      : { ...storedNames };

    const board = createBoard(r, c);
    const startPlayer = isOnline ? 1 as PlayerID : (Math.floor(Math.random() * numPlayers) + 1) as PlayerID;

    const newState: GameState = {
      board,
      currentPlayer: startPlayer,
      mode,
      rows: r,
      cols: c,
      numPlayers,
      gameId,
      localPlayerId: localId,
      gameOver: false,
      winner: undefined,
      vsComputer: vsComputer && numPlayers === 2,
      computerPlayer: (vsComputer && numPlayers === 2) ? 2 : undefined,
      initialPlaced: { 1: false, 2: false, 3: false, 4: false },
      playerNames,
      playerStats: storedStats,
      isOnline,
      lastMove: undefined,
    };

    set({ isAnimating: false, state: newState });

    if (isOnline) {
      startPolling(gameId || '', localId as PlayerID);
      sessionStorage.setItem('gs_session', JSON.stringify({
        gameId,
        playerId: localId as PlayerID,
        isOnline: true,
      }));
    }

    if (vsComputer && startPlayer === 2) {
      setTimeout(async () => {
        const currentStore = useGameStore.getState();
        if (currentStore.isAnimating || currentStore.state.gameOver) return;
        const move = getComputerMove(currentStore.state);
        if (move) await currentStore.attemptMove(move[0], move[1]);
      }, 800);
    }
  },

  attemptMove: async (x, y, isRemote = false) => {
    const { state, isAnimating } = get();
    if (state.gameOver || isAnimating) return;

    const isBotTurn = state.vsComputer && state.currentPlayer === state.computerPlayer;
    const isOurTurn = !state.localPlayerId || state.currentPlayer === state.localPlayerId || isBotTurn;
    if (!isRemote && !isOurTurn) return;

    const cell = state.board[x][y];
    if (!isValidMove(cell, state.currentPlayer, state)) return;

    set({ isAnimating: true });
    if (!isRemote) playClick();

    const isOnlineLocal = state.isOnline && !isRemote && state.localPlayerId;

    const placedState = { ...state, board: state.board.map(row => row.map(c => ({ ...c }))), lastMove: { x, y, player: state.currentPlayer } };
    const targetCell = placedState.board[x][y];
    targetCell.count += 1;
    targetCell.owner = placedState.currentPlayer;
    if (!placedState.initialPlaced[placedState.currentPlayer]) {
      placedState.initialPlaced = { ...placedState.initialPlaced, [placedState.currentPlayer]: true };
    }
    set({ state: placedState });

    const steps = getExplosionSteps(placedState);
    for (let i = 1; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      playExplosion(1 + i * 0.3);
      set({ state: steps[i] });
    }

    const finalState = { ...get().state };
    const afterWin = checkWin(finalState);

    if (afterWin.gameOver) {
      const stats = { ...finalState.playerStats };
      if (afterWin.winner === finalState.localPlayerId || (finalState.vsComputer && afterWin.winner === 1)) {
        stats.wins += 1;
      } else if (finalState.localPlayerId || finalState.vsComputer) {
        stats.losses += 1;
      }
      localStorage.setItem('gs_stats', JSON.stringify(stats));
      afterWin.playerStats = stats;
      if (!isRemote) {
        if (afterWin.winner === finalState.localPlayerId || (finalState.vsComputer && afterWin.winner === 1)) {
          playWin();
        } else {
          playLose();
        }
      }
    } else {
      let nextPlayer = (afterWin.currentPlayer % afterWin.numPlayers + 1) as PlayerID;
      let attempts = 0;
      while (attempts < 4) {
        const hasPlaced = afterWin.initialPlaced[nextPlayer];
        const ownsCells = afterWin.board.some(row => row.some(c => c.owner === nextPlayer));
        if (!hasPlaced || ownsCells) {
          afterWin.currentPlayer = nextPlayer;
          break;
        }
        nextPlayer = (nextPlayer % afterWin.numPlayers + 1) as PlayerID;
        attempts++;
      }
    }

    set({ state: afterWin, isAnimating: false });

    // Submit online move to server for persistence & sync
    if (isOnlineLocal) {
      try {
        await fetch(`${API_BASE}/game/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: state.gameId, playerId: state.localPlayerId, x, y }),
        });
      } catch {
        // Server will sync on next poll
      }
    }

    if (!afterWin.gameOver && afterWin.vsComputer && afterWin.currentPlayer === afterWin.computerPlayer) {
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

  resetGame: async (isRemote = false) => {
    stopPolling();
    const { rows, cols, mode, vsComputer, numPlayers, gameId, localPlayerId, playerNames, playerStats, isOnline } = get().state;
    const board = createBoard(rows, cols);
    const startPlayer = isOnline ? 1 as PlayerID : (Math.floor(Math.random() * numPlayers) + 1) as PlayerID;

    const newState: GameState = {
      ...get().state,
      board,
      currentPlayer: startPlayer,
      mode,
      rows,
      cols,
      numPlayers,
      gameId,
      localPlayerId,
      gameOver: false,
      winner: undefined,
      vsComputer: vsComputer && numPlayers === 2,
      computerPlayer: (vsComputer && numPlayers === 2) ? 2 : undefined,
      initialPlaced: { 1: false, 2: false, 3: false, 4: false },
      playerNames,
      playerStats,
      lastMove: undefined,
    };

    set({ isAnimating: false, state: newState });

    if (isOnline && !isRemote && gameId) {
      try {
        await fetch(`${API_BASE}/game/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId, playerId: localPlayerId }),
        });
      } catch {}
    }

    if (isOnline && gameId) {
      startPolling(gameId, localPlayerId || 1);
    }

    if (vsComputer && startPlayer === 2) {
      setTimeout(async () => {
        const currentStore = useGameStore.getState();
        if (currentStore.isAnimating || currentStore.state.gameOver) return;
        const move = getComputerMove(currentStore.state);
        if (move) await currentStore.attemptMove(move[0], move[1]);
      }, 800);
    }
  },

  clearGame: () => {
    const { gameId, isOnline } = get().state;
    if (isOnline && gameId) {
      navigator.sendBeacon(
        `${API_BASE}/game/leave`,
        new Blob([JSON.stringify({ gameId })], { type: 'application/json' }),
      );
    }
    stopPolling();
    sessionStorage.removeItem('gs_session');
    const storedNames = JSON.parse(localStorage.getItem('gs_playerNames') || '{"1":"Player 1","2":"Player 2","3":"Player 3","4":"Player 4"}');
    set({
      state: {
        board: [],
        currentPlayer: 1 as PlayerID,
        mode: 'classic',
        rows: 0,
        cols: 0,
        numPlayers: 2,
        gameOver: false,
        winner: undefined,
        vsComputer: false,
        initialPlaced: { 1: false, 2: false, 3: false, 4: false },
        playerNames: storedNames,
        playerStats: JSON.parse(localStorage.getItem('gs_stats') || '{"wins":0, "losses":0}'),
        isOnline: false,
        lastMove: undefined,
      },
    });
  },

  setPlayerName: (playerId: PlayerID, name: string) => {
    const { state } = get();
    const newNames = { ...state.playerNames, [playerId]: name };
    localStorage.setItem('gs_playerNames', JSON.stringify(newNames));
    set({ state: { ...state, playerNames: newNames } });

    if (state.isOnline && state.gameId) {
      fetch(`${API_BASE}/game/name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: state.gameId,
          playerId,
          name,
        }),
      }).catch(() => {});
    }
  },

  setMode: (mode: 'classic' | 'fixed') => {
    set(state => ({
      state: { ...state.state, mode },
    }));
  },
}));
