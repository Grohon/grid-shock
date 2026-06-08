import { getGame, setGame } from '../lib/game-store';
export default async function handler(req: any, res: any) {
  await setGame('test-' + Date.now(), {
    board: [], currentPlayer: 1, mode: 'classic', rows: 3, cols: 3,
    numPlayers: 2, gameOver: false, vsComputer: false,
    playerNames: { 1: 'a', 2: 'b', 3: 'c', 4: 'd' },
    playerStats: { wins: 0, losses: 0 },
    initialPlaced: { 1: false, 2: false, 3: false, 4: false },
    isOnline: false,
  } as any);
  const g = await getGame('test');
  return res.status(200).json({ ok: true, game: !!g });
}
