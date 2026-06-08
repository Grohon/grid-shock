import { getGame, setGame } from '../db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { gameId, playerName } = req.body;
  if (!gameId) return res.status(400).json({ error: 'Missing gameId' });

  const state = await getGame(gameId);
  if (!state) return res.status(404).json({ error: 'Room not found' });
  if (state.gameOver) return res.status(400).json({ error: 'Game is already over' });

  let playerId: number | null = null;
  for (let i = 2; i <= state.numPlayers; i++) {
    if (!state.initialPlaced[i]) {
      if (state.playerNames[i] === `Player ${i}`) { playerId = i; break; }
    }
    const ownsCells = state.board.some((row: any[]) => row.some((c: any) => c.owner === i));
    if (ownsCells) continue;
    if (!state.initialPlaced[i]) { playerId = i; break; }
  }

  if (!playerId) {
    if (!state.initialPlaced[2] || state.board.some((row: any[]) => row.some((c: any) => c.owner === 2)))
      return res.status(400).json({ error: 'Room is full' });
    playerId = 2;
  }

  state.playerNames = { ...state.playerNames, [playerId]: playerName || `Player ${playerId}` };
  await setGame(gameId, state);
  return res.status(200).json({ playerId, state: { ...state, localPlayerId: playerId } });
}
