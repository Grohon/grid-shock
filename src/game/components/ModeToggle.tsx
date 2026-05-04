import React, { useState, useEffect } from 'react';
import { useGameStore, ROOM_PREFIX } from '../store';
import { Peer } from 'peerjs';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function ModeToggle() {
  const initGame = useGameStore(state => state.initGame);
  const gameState = useGameStore(state => state.state);

  // Load all player names from localStorage
  const [playerNames, setPlayerNames] = useState<Record<number, string>>(() => {
    const raw = JSON.parse(localStorage.getItem('gs_playerNames') || '{"1":"Player 1","2":"Player 2","3":"Player 3","4":"Player 4"}');
    return { 1: raw['1'], 2: raw['2'], 3: raw['3'], 4: raw['4'] };
  });

  // Sync names to localStorage and store on change
  useEffect(() => {
    localStorage.setItem('gs_playerNames', JSON.stringify(playerNames));
    useGameStore.setState(s => ({
      state: { ...s.state, playerNames: { ...s.state.playerNames, ...playerNames } }
    }));
  }, [playerNames]);

  const [mode, setMode] = useState<'classic' | 'fixed'>(() => {
    return (localStorage.getItem('gameMode') as 'classic' | 'fixed') || 'fixed';
  });
  const [rows, setRows] = useState(() => {
    return Number(localStorage.getItem('gameRows')) || 6;
  });
  const [cols, setCols] = useState(() => {
    return Number(localStorage.getItem('gameCols')) || 6;
  });
  const [numPlayers, setNumPlayers] = useState(() => {
    return Number(localStorage.getItem('gameNumPlayers')) || 2;
  });
  const [vsComputer, setVsComputer] = useState(() => {
    const saved = localStorage.getItem('gameVsComputer');
    return saved === null ? true : saved === 'true';
  });

  const [view, setView] = useState<'create' | 'join'>('create');
  const [joinId, setJoinId] = useState('');
  const [isOnline, setIsOnline] = useState(false);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('gameMode', mode);
    localStorage.setItem('gameRows', rows.toString());
    localStorage.setItem('gameCols', cols.toString());
    localStorage.setItem('gameNumPlayers', numPlayers.toString());
    localStorage.setItem('gameVsComputer', vsComputer.toString());
    localStorage.setItem('gameIsOnline', isOnline.toString());
  }, [mode, rows, cols, numPlayers, vsComputer, isOnline]);

  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    localStorage.setItem('gs_playerNames', JSON.stringify(playerNames));
    const effectiveVsComputer = numPlayers === 2 && !isOnline && vsComputer;
    initGame(rows, cols, mode, effectiveVsComputer, numPlayers, undefined, isOnline ? 1 : undefined, isOnline);
  };

  const handleJoin = () => {
    if (joinId.length < 4) return;

    localStorage.setItem('gs_playerNames', JSON.stringify(playerNames));
    setIsChecking(true);
    setError(null);

    const tempPeer = new Peer({ config: ICE_SERVERS });

    tempPeer.on('open', () => {
      const conn = tempPeer.connect(ROOM_PREFIX + joinId);

      const timeout = setTimeout(() => {
        tempPeer.destroy();
        setError('Room not found or host unavailable.');
        setIsChecking(false);
      }, 5000);

      conn.on('open', () => {
        clearTimeout(timeout);
        tempPeer.destroy();
        initGame(rows, cols, mode, false, numPlayers, joinId, 2, true);
        setIsChecking(false);
      });

      conn.on('error', () => {
        clearTimeout(timeout);
        tempPeer.destroy();
        setError('Could not connect to room.');
        setIsChecking(false);
      });
    });

    tempPeer.on('error', () => {
      setError('Network error. Check your connection.');
      setIsChecking(false);
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-material-surfaceVariant/30 p-4 rounded-m3-xl space-y-3 border border-material-outline/10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-material-primary uppercase tracking-wider">Your Profile</h3>
          <div className="flex gap-3 text-[10px] font-black text-material-onSurfaceVariant/60">
            <span>WINS: <span className="text-green-600">{gameState.playerStats.wins}</span></span>
            <span>LOSSES: <span className="text-red-600">{gameState.playerStats.losses}</span></span>
          </div>
        </div>
        <input
          type="text"
          placeholder="Player 1 name..."
          value={playerNames[1]}
          onChange={(e) => setPlayerNames(prev => ({ ...prev, [1]: e.target.value }))}
          className="w-full bg-white/50 p-3 rounded-m3-lg border border-material-outline/20 focus:border-material-primary focus:ring-1 focus:ring-material-primary outline-none transition-all font-bold text-material-onSurface"
          maxLength={15}
        />
      </div>

      {/* Play Mode Switcher */}
      <div className="flex bg-material-secondaryContainer/30 p-1 rounded-m3-lg border border-material-outline/10">
        <button
          onClick={() => { setIsOnline(false); setView('create'); }}
          className={`flex-1 py-2.5 text-sm font-bold rounded-m3-md transition-all flex items-center justify-center gap-2 ${!isOnline ? 'bg-material-primary text-material-onPrimary shadow-m3-1' : 'text-material-onSurfaceVariant/70 hover:text-material-onSurface'}`}
        >
          <span>📱</span> Pass & Play
        </button>
        <button
          onClick={() => setIsOnline(true)}
          className={`flex-1 py-2.5 text-sm font-bold rounded-m3-md transition-all flex items-center justify-center gap-2 ${isOnline ? 'bg-material-primary text-material-onPrimary shadow-m3-1' : 'text-material-onSurfaceVariant/70 hover:text-material-onSurface'}`}
        >
          <span>🌐</span> Online
        </button>
      </div>

      {/* View Switcher - Only visible when Online */}
      {isOnline && (
        <div className="flex bg-material-surfaceVariant/20 p-1 rounded-m3-lg border border-material-outline/10 animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => setView('create')}
            className={`flex-1 py-2 text-sm font-bold rounded-m3-md transition-all ${view === 'create' ? 'bg-white text-material-primary shadow-sm' : 'text-material-onSurfaceVariant/70 hover:text-material-onSurface'}`}
          >
            Create Room
          </button>
          <button
            onClick={() => setView('join')}
            className={`flex-1 py-2 text-sm font-bold rounded-m3-md transition-all ${view === 'join' ? 'bg-white text-material-primary shadow-sm' : 'text-material-onSurfaceVariant/70 hover:text-material-onSurface'}`}
          >
            Join Room
          </button>
        </div>
      )}

      {view === 'create' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-material-onSurfaceVariant ml-1">
                Game Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'fixed',   label: 'Fixed',   desc: 'Threshold of 4' },
                  { value: 'classic', label: 'Classic', desc: 'Dynamic threshold' },
                ] as const).map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setMode(value)}
                    className={`flex flex-col items-center py-2.5 px-3 rounded-m3-md font-bold transition-all border text-sm
                      ${mode === value
                        ? 'bg-material-primary text-material-onPrimary border-material-primary shadow-m3-1'
                        : 'bg-material-surfaceVariant/30 text-material-onSurfaceVariant border-material-outline/10 hover:bg-material-surfaceVariant'}`}
                  >
                    {label}
                    <span className={`text-[10px] font-normal mt-0.5 ${mode === value ? 'text-material-onPrimary/70' : 'text-material-onSurfaceVariant/60'}`}>
                      {desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-material-onSurfaceVariant ml-1">
                Number of Players
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setNumPlayers(n)}
                    className={`
                      py-2 rounded-m3-md font-bold transition-all border border-material-outline/10
                      ${numPlayers === n
                        ? 'bg-material-primary text-material-onPrimary shadow-m3-1'
                        : 'bg-material-surfaceVariant/30 text-material-onSurfaceVariant hover:bg-material-surfaceVariant'}
                    `}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {!isOnline && numPlayers === 2 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-material-onSurfaceVariant ml-1">
                  Game Type
                </label>
                <div className="flex items-center justify-between p-3 rounded-m3-md bg-material-surfaceVariant/20 border border-material-outline/10">
                  <div className="flex flex-col">
                    <span className="font-medium text-material-onSurface">Vs Computer</span>
                    <span className="text-xs text-material-onSurfaceVariant">Play against an AI opponent</span>
                  </div>
                  <button
                    onClick={() => setVsComputer(!vsComputer)}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none
                      ${vsComputer ? 'bg-material-primary' : 'bg-material-outline/30'}
                    `}
                  >
                    <div
                      className={`
                        absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm
                        ${vsComputer ? 'translate-x-6' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>
                {!vsComputer && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-material-onSurfaceVariant/60 w-10 shrink-0">P2</span>
                    <input
                      type="text"
                      placeholder="Player 2 name..."
                      value={playerNames[2]}
                      onChange={(e) => setPlayerNames(prev => ({ ...prev, [2]: e.target.value }))}
                      className="flex-1 bg-white/50 p-3 rounded-m3-lg border border-material-outline/20 focus:border-material-primary focus:ring-1 focus:ring-material-primary outline-none transition-all font-medium text-material-onSurface"
                      maxLength={15}
                    />
                  </div>
                )}
              </div>
            )}

            {!isOnline && numPlayers > 2 && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-material-onSurfaceVariant ml-1">
                  Opponent Names
                </label>
                <div className="space-y-2">
                  {Array.from({ length: numPlayers - 1 }, (_, i) => i + 2).map(playerId => (
                    <div key={playerId} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-material-onSurfaceVariant/60 w-10 shrink-0">P{playerId}</span>
                      <input
                        type="text"
                        placeholder={`Player ${playerId} name...`}
                        value={playerNames[playerId]}
                        onChange={(e) => setPlayerNames(prev => ({ ...prev, [playerId]: e.target.value }))}
                        className="flex-1 bg-white/50 p-3 rounded-m3-lg border border-material-outline/20 focus:border-material-primary focus:ring-1 focus:ring-material-primary outline-none transition-all font-medium text-material-onSurface"
                        maxLength={15}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}


            <div className="flex gap-4 pt-4 xyz">
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-bold text-material-onSurface">
                    Rows
                  </label>
                  <span className="text-sm font-bold text-material-primary bg-material-primary/15 px-4 py-1 rounded-full shadow-sm">
                    {rows}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={3}
                    max={10}
                    step={1}
                    value={rows}
                    onChange={e => setRows(Number(e.target.value))}
                    className="m3-slider"
                  />
                  <div className="flex justify-between w-full px-1 mt-2 text-[10px] font-black text-material-onSurfaceVariant/40 tracking-tighter">
                    <span>3 ROWS</span>
                    <span>10 ROWS</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-bold text-material-onSurface">
                    Columns
                  </label>
                  <span className="text-sm font-bold text-material-primary bg-material-primary/15 px-4 py-1 rounded-full shadow-sm">
                    {cols}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={3}
                    max={10}
                    step={1}
                    value={cols}
                    onChange={e => setCols(Number(e.target.value))}
                    className="m3-slider"
                  />
                  <div className="flex justify-between w-full px-1 mt-2 text-[10px] font-black text-material-onSurfaceVariant/40 tracking-tighter">
                    <span>3 COLS</span>
                    <span>10 COLS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="m3-button-filled w-full text-lg py-4 shadow-m3-2 hover:shadow-m3-3 mt-4"
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex flex-col gap-4">
            <label className="text-sm font-bold text-material-onSurface px-1">
              Invite Code
            </label>
            <input
              type="text"
              placeholder="ENTER 6-DIGIT CODE"
              maxLength={6}
              value={joinId}
              onChange={e => setJoinId(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-material-surfaceVariant/30 border-2 border-material-primary/20 rounded-m3-lg px-6 py-4 text-center text-2xl font-black tracking-widest text-material-primary placeholder:text-material-outline/30 focus:border-material-primary focus:outline-none transition-all uppercase"
            />
            <p className="text-xs text-center text-material-onSurfaceVariant px-4">
              Enter the unique room ID from your friend to join their session.
            </p>
            {error && (
              <p className="text-xs text-center text-red-500 font-bold bg-red-50 py-2 rounded-m3-md animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </div>
          <button
            disabled={joinId.length < 4 || isChecking}
            onClick={handleJoin}
            className="m3-button-filled w-full text-lg py-4 shadow-m3-2 hover:shadow-m3-3 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
          >
            {isChecking ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Checking Room...
              </>
            ) : (
              'Join Room'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
