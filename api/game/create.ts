import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initGameState } from '../../src/game/engine';
import { setGame } from '../lib/game-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode, rows, cols, numPlayers, playerName } = req.body;

  if (!mode || !rows || !cols || !numPlayers) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['classic', 'fixed'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  const r = Math.max(3, Math.min(10, rows));
  const c = Math.max(3, Math.min(10, cols));

  const ADJECTIVES = ['blue','red','cool','warm','fast','bold','calm','dark','keen','fair','gold','huge','iced','jade','kind','lite','mini','neat','pure','rare','safe','soft','tall','thin','wild','bald','deep','even','flat','glad','half','iron','jolly','lazy','nice','odd','pale','rich','shy','slim','vast','warm','zest','busy','dull','fine','high','long','low','mock','pink'];
  const NOUNS = ['bird','wolf','bear','frog','deer','hawk','lion','seal','dove','fish','crab','snail','swan','hare','slug','puma','kiwi','moth','newt','orca','racoon','bat','bee','elk','fox','gnu','hen','ibis','jay','koi','lynx','moose','owl','panda','quail','robin','shark','tiger','urus','viper','whale','yak','zebra','ant','bug','cat','dog','eel','fly','gnat','ram'];
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const gameId = `${a}-${noun}-${suffix}`;
  const playerNames = {
    1: (playerName as string) || 'Player 1',
    2: 'Player 2',
    3: 'Player 3',
    4: 'Player 4',
  } as Record<1 | 2 | 3 | 4, string>;

  const state = initGameState(r, c, mode, false, numPlayers, gameId, playerNames);
  state.currentPlayer = 1;

  await setGame(gameId, state);

  return res.status(200).json({
    gameId: state.gameId,
    playerId: 1,
    state: { ...state, localPlayerId: 1 },
  });
}
