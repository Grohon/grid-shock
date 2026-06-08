import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PlayerID } from '../../src/game/types';
import { createBoard } from '../../src/game/engine';
import { getGame, setGame } from '../lib/game-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameId } = req.body;

  if (!gameId) {
    return res.status(400).json({ error: 'Missing gameId' });
  }

  const state = await getGame(gameId);
  if (!state) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const newState = { ...state };
  newState.board = createBoard(state.rows, state.cols);
  newState.currentPlayer = 1 as PlayerID;
  newState.gameOver = false;
  newState.winner = undefined;
  newState.initialPlaced = { 1: false, 2: false, 3: false, 4: false };
  newState.lastMove = undefined;

  await setGame(gameId, newState);

  return res.status(200).json({ state: newState });
}
