import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { Peer } from 'peerjs';

export default function ModeToggle() {
  const initGame = useGameStore(state => state.initGame);

  // Load initial values from localStorage or use defaults
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

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('gameMode', mode);
    localStorage.setItem('gameRows', rows.toString());
    localStorage.setItem('gameCols', cols.toString());
    localStorage.setItem('gameNumPlayers', numPlayers.toString());
    localStorage.setItem('gameVsComputer', vsComputer.toString());
  }, [mode, rows, cols, numPlayers, vsComputer]);

  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    initGame(rows, cols, mode, vsComputer, numPlayers, undefined, 1);
  };

  const handleJoin = () => {
    if (joinId.length < 4) return;
    
    setIsChecking(true);
    setError(null);

    const tempPeer = new Peer();
    const ROOM_PREFIX = 'GS_ROOM_';
    
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
        initGame(rows, cols, mode, false, numPlayers, joinId, 2);
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
      {/* View Switcher */}
      <div className="flex bg-material-surfaceVariant/20 p-1 rounded-m3-lg border border-material-outline/10">
        <button
          onClick={() => setView('create')}
          className={`flex-1 py-2 text-sm font-bold rounded-m3-md transition-all ${view === 'create' ? 'bg-white text-material-primary shadow-sm' : 'text-material-onSurfaceVariant/70 hover:text-material-onSurface'}`}
        >
          New Game
        </button>
        <button
          onClick={() => setView('join')}
          className={`flex-1 py-2 text-sm font-bold rounded-m3-md transition-all ${view === 'join' ? 'bg-white text-material-primary shadow-sm' : 'text-material-onSurfaceVariant/70 hover:text-material-onSurface'}`}
        >
          Join Game
        </button>
      </div>

      {view === 'create' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-material-onSurfaceVariant ml-1">
                Game Mode
              </label>
              <select
                className="m3-select w-full"
                value={mode}
                onChange={e => setMode(e.target.value as 'classic' | 'fixed')}
              >
                <option value="classic">Classic (Dynamic Threshold)</option>
                <option value="fixed">Fixed (Threshold: 4)</option>
              </select>
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

            {numPlayers === 2 && (
              <div className="flex items-center justify-between p-3 rounded-m3-md bg-material-surfaceVariant/20 border border-material-outline/10 animate-in fade-in slide-in-from-top-1">
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
            )}


            <div className="space-y-8 pt-4">
              <div className="flex flex-col gap-4">
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

              <div className="flex flex-col gap-4">
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
              placeholder="ENTER 6-CHAR CODE"
              maxLength={6}
              value={joinId}
              onChange={e => setJoinId(e.target.value.toUpperCase())}
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
