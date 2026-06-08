import type { PlayerID } from './types';
import { isValidMove, resolveExplosions, checkWin } from './engine';
import { getGame, setGame } from './game-store';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameId, playerId, x, y } = req.body;

  if (!gameId || !playerId || x === undefined || y === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const state = await getGame(gameId);

  if (!state) {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (state.gameOver) {
    return res.status(400).json({ error: 'Game is already over' });
  }

  if (state.currentPlayer !== playerId) {
    return res.status(400).json({ error: 'Not your turn' });
  }

  const cell = state.board[x][y];
  if (!cell) {
    return res.status(400).json({ error: 'Invalid cell position' });
  }

  if (!isValidMove(cell, playerId as PlayerID, state)) {
    return res.status(400).json({ error: 'Invalid move' });
  }

  state.board = state.board.map(row => row.map(c => ({ ...c })));
  const targetCell = state.board[x][y];
  targetCell.count += 1;
  targetCell.owner = playerId as PlayerID;
  state.lastMove = { x, y, player: playerId as PlayerID };

  if (!state.initialPlaced[playerId as PlayerID]) {
    state.initialPlaced = { ...state.initialPlaced, [playerId as PlayerID]: true };
  }

  const afterExplosions = resolveExplosions(state);
  const afterWin = checkWin(afterExplosions);
  afterWin.lastMove = { x, y, player: playerId as PlayerID };

  if (!afterWin.gameOver) {
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

  await setGame(gameId, afterWin);

  return res.status(200).json({ state: afterWin });
}
