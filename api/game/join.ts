import { getGame, setGame } from './game-store';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gameId, playerName } = req.body;

  if (!gameId) {
    return res.status(400).json({ error: 'Missing gameId' });
  }

  const state = await getGame(gameId);

  if (!state) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (state.gameOver) {
    return res.status(400).json({ error: 'Game is already over' });
  }

  let playerId: 2 | 3 | 4 | null = null;
  for (let i = 2; i <= state.numPlayers; i++) {
    const id = i as 2 | 3 | 4;
      if (!state.initialPlaced[id]) {
        const alreadyJoined = state.playerNames[id] !== `Player ${id}`;
        if (!alreadyJoined) {
          playerId = id;
          break;
        }
      }
    const ownsCells = state.board.some(row => row.some(c => c.owner === id));
    if (ownsCells) continue;
    if (!state.initialPlaced[id]) {
      playerId = id;
      break;
    }
  }

  if (!playerId) {
    if (!state.initialPlaced[2 as 2 | 3 | 4] || state.board.some(row => row.some(c => c.owner === 2))) {
      return res.status(400).json({ error: 'Room is full' });
    }
    playerId = 2;
  }

  state.playerNames = {
    ...state.playerNames,
    [playerId]: (playerName as string) || `Player ${playerId}`,
  };

  await setGame(gameId, state);

  return res.status(200).json({
    playerId,
    state: { ...state, localPlayerId: playerId },
  });
}
