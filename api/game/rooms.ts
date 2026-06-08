import { getAllGameIds, getGame } from '../lib/game-store';
import type { PlayerID } from '../lib/types';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const gameIds = await getAllGameIds();
  const rooms: Array<{
    gameId: string;
    mode: string;
    rows: number;
    cols: number;
    numPlayers: number;
    filledSlots: number;
    hostName: string;
  }> = [];

  for (const id of gameIds) {
    const state = await getGame(id);
    if (!state || state.gameOver) continue;

    let filledSlots = 1;
    for (let i = 2; i <= state.numPlayers; i++) {
      const pid = i as PlayerID;
      if (state.initialPlaced[pid] || state.playerNames[pid] !== `Player ${pid}`) {
        filledSlots++;
      }
    }

    if (filledSlots >= state.numPlayers) continue;

    rooms.push({
      gameId: id,
      mode: state.mode,
      rows: state.rows,
      cols: state.cols,
      numPlayers: state.numPlayers,
      filledSlots,
      hostName: state.playerNames[1],
    });
  }

  return res.status(200).json({ rooms });
}
