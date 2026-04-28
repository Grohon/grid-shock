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

import { Peer, DataConnection } from 'peerjs';

interface GameStore {
  state: GameState;
  isAnimating: boolean;
  initGame: (rows: number, cols: number, mode: 'classic' | 'fixed', vsComputer: boolean, numPlayers: number, gameId?: string, localPlayerId?: PlayerID) => void;
  attemptMove: (x: number, y: number, isRemote?: boolean) => Promise<void>;
  resetGame: (isRemote?: boolean) => void;
  clearGame: () => void;
}

// Networking state (managed outside Zustand to avoid serialization issues)
const ROOM_PREFIX = 'GS_ROOM_';
let peerInstance: Peer | null = null;
let activeConnections: DataConnection[] = [];

/** Helper to clean up existing connections */
const cleanupNetworking = () => {
  activeConnections.forEach(conn => conn.close());
  activeConnections = [];
  if (peerInstance) {
    peerInstance.destroy();
    peerInstance = null;
  }
};

/** Shared message handler */
const handlePeerData = (data: any) => {
  const store = useGameStore.getState();
  const { type, x, y, player, state: remoteState } = data;

  if (type === 'MOVE' && player === store.state.currentPlayer) {
    store.attemptMove(x, y, true);
  } 
  else if (type === 'RESET') {
    // Force a local reset without broadcasting back
    store.resetGame(true);
  }
  else if (type === 'SYNC_REQUEST') {
    // If we are host, broadcast our state to the new connection
    broadcastToPeers({
      type: 'SYNC_RESPONSE',
      state: store.state
    });
  } 
  else if (type === 'SYNC_RESPONSE' && remoteState) {
    useGameStore.setState({
      state: {
        ...remoteState,
        localPlayerId: store.state.localPlayerId,
        gameId: store.state.gameId // Keep our 6-char ID
      }
    });
  }
};

/** Broadcast to all connected peers */
const broadcastToPeers = (data: any) => {
  activeConnections.forEach(conn => {
    if (conn.open) {
      conn.send(data);
    }
  });
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
    initialPlaced: { 1: false, 2: false, 3: false, 4: false },
  },
  isAnimating: false,
  initGame: (rows, cols, mode, vsComputer, numPlayers = 2, gameId?: string, localPlayerId?: PlayerID) => {
    // 0. Cleanup old networking
    cleanupNetworking();

    // Defensive clamping
    const r = Math.max(3, Math.min(10, rows));
    const c = Math.max(3, Math.min(10, cols));

    const board = createBoard(r, c);
    const startPlayer = (vsComputer && numPlayers === 2 && Math.random() > 0.5) ? 2 : 1;
    
    // Generate a random 6-character room ID if not provided
    const id = gameId || Math.random().toString(36).substring(2, 8).toUpperCase();

    const newState: GameState = {
      board,
      currentPlayer: startPlayer as PlayerID,
      mode,
      rows: r,
      cols: c,
      numPlayers,
      gameId: id,
      localPlayerId,
      gameOver: false,
      winner: undefined,
      vsComputer: vsComputer && numPlayers === 2,
      computerPlayer: (vsComputer && numPlayers === 2) ? 2 : undefined,
      initialPlaced: { 1: false, 2: false, 3: false, 4: false },
    };

    set({ isAnimating: false, state: newState });

    // 1. Networking Setup
    if (localPlayerId === 1) {
      // HOST: Setup peer server with prefixed ID
      useGameStore.setState(s => ({ state: { ...s.state, connectionStatus: 'connecting' } }));
      peerInstance = new Peer(ROOM_PREFIX + id);
      
      peerInstance.on('open', () => {
        useGameStore.setState(s => ({ state: { ...s.state, connectionStatus: 'connected' } }));
      });

      peerInstance.on('connection', (conn) => {
        activeConnections.push(conn);
        conn.on('data', handlePeerData);
        conn.on('close', () => {
          activeConnections = activeConnections.filter(c => c !== conn);
        });
      });

      peerInstance.on('error', () => {
        useGameStore.setState(s => ({ state: { ...s.state, connectionStatus: 'disconnected' } }));
      });
    } else if (gameId && localPlayerId) {
      // JOINER: Connect to host
      useGameStore.setState(s => ({ state: { ...s.state, connectionStatus: 'connecting' } }));
      peerInstance = new Peer(); 
      peerInstance.on('open', () => {
        const conn = peerInstance!.connect(ROOM_PREFIX + gameId);
        activeConnections.push(conn);
        conn.on('open', () => {
          useGameStore.setState(s => ({ state: { ...s.state, connectionStatus: 'connected' } }));
          conn.on('data', handlePeerData);
          conn.send({ type: 'SYNC_REQUEST' });
        });
        conn.on('close', () => {
          activeConnections = activeConnections.filter(c => c !== conn);
          useGameStore.setState(s => ({ state: { ...s.state, connectionStatus: 'disconnected' } }));
        });
        conn.on('error', () => {
          useGameStore.setState(s => ({ state: { ...s.state, connectionStatus: 'disconnected' } }));
        });
      });
      peerInstance.on('error', () => {
        useGameStore.setState(s => ({ state: { ...s.state, connectionStatus: 'disconnected' } }));
      });
    } else {
      useGameStore.setState(s => ({ state: { ...s.state, connectionStatus: 'offline' } }));
    }

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
  attemptMove: async (x, y, isRemote = false) => {
    const { state, isAnimating } = get();
    if (state.gameOver || isAnimating) return;

    // Allow moves if it's our turn OR it's a remote move OR it's a local bot move
    const isBotTurn = state.vsComputer && state.currentPlayer === state.computerPlayer;
    const isOurTurn = !state.localPlayerId || state.currentPlayer === state.localPlayerId || isBotTurn;
    
    if (!isRemote && !isOurTurn) return;

    const cell = state.board[x][y];
    if (!isValidMove(cell, state.currentPlayer, state)) return;

    set({ isAnimating: true });

    // 1. Initial placement
    const placedState = { ...state, board: state.board.map(row => row.map(c => ({ ...c }))) };
    const targetCell = placedState.board[x][y];
    targetCell.count += 1;
    targetCell.owner = placedState.currentPlayer;

    if (!placedState.initialPlaced[placedState.currentPlayer]) {
      // We must clone the record to avoid mutating original state
      placedState.initialPlaced = { ...placedState.initialPlaced, [placedState.currentPlayer]: true };
    }

    set({ state: placedState });

    // Sync the move to other peers if it's a local move
    if (!isRemote && state.gameId) {
      broadcastToPeers({
        type: 'MOVE',
        gameId: state.gameId,
        x,
        y,
        player: state.currentPlayer
      });
    }

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
      // Switch to next player, skipping those who are out
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

  resetGame: (isRemote = false) => {
    const { rows, cols, mode, vsComputer, numPlayers, gameId, localPlayerId } = get().state;
    const board = createBoard(rows, cols);
    const startPlayer = (vsComputer && numPlayers === 2 && Math.random() > 0.5) ? 2 : 1;

    const newState: GameState = {
      board,
      currentPlayer: startPlayer as PlayerID,
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
    };

    set({ isAnimating: false, state: newState });

    // Broadcast reset if it's a local action
    if (!isRemote) {
      broadcastToPeers({ type: 'RESET' });
    }

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
        numPlayers: 2,
        gameOver: false,
        winner: undefined,
        initialPlaced: { 1: false, 2: false, 3: false, 4: false },
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
