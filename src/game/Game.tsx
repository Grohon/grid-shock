import React, { useEffect, useState } from 'react';
import Home from './components/Home';
import Play from './components/Play';
import { useGameStore } from './store';

const API_BASE = '/api';

export default function Game() {
  const { state, initGame } = useGameStore();
  const { rows, currentPlayer } = state;
  const [roomError, setRoomError] = useState<string | null>(null);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const isPlaying = rows > 0;

  const playerBackgrounds = {
    1: 'linear-gradient(135deg, #F3EFFF 0%, #EADDFF 100%)',
    2: 'linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)',
    3: 'linear-gradient(135deg, #FFFDE7 0%, #FFF59D 100%)',
    4: 'linear-gradient(135deg, #FFF1F0 0%, #FFD1D1 100%)',
  };

  // Notify server when tab is closed during online game
  useEffect(() => {
    if (!isPlaying || !state.gameId || !state.isOnline) return;
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        `${API_BASE}/game/leave`,
        JSON.stringify({ gameId: state.gameId, playerId: state.localPlayerId }),
      );
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPlaying, state.gameId, state.isOnline, state.localPlayerId]);

  // Update address bar to show room link
  useEffect(() => {
    if (isPlaying && state.gameId && state.isOnline) {
      window.history.replaceState({}, '', `/room/${state.gameId}`);
    } else if (!isPlaying && !joiningRoom) {
      window.history.replaceState({}, '', '/');
    }
  }, [isPlaying, state.gameId, state.isOnline, joiningRoom]);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/room\/(\d+)$/);
    if (!match) return;

    const gameId = match[1];
    const storedNames = JSON.parse(
      localStorage.getItem('gs_playerNames') ||
      '{"1":"Player 1","2":"Player 2","3":"Player 3","4":"Player 4"}'
    );

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJoiningRoom(true);

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/game/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId,
            playerName: storedNames[1] || 'Player 1',
          }),
        });
        const data = await res.json();

        if (res.ok) {
          const storedRows = Number(localStorage.getItem('gameRows')) || 6;
          const storedCols = Number(localStorage.getItem('gameCols')) || 6;
          const storedMode = (localStorage.getItem('gameMode') as 'classic' | 'fixed') || 'fixed';
          const storedNumPlayers = Number(localStorage.getItem('gameNumPlayers')) || 2;

          initGame(
            storedRows,
            storedCols,
            data.state.mode || storedMode,
            false,
            data.state.numPlayers || storedNumPlayers,
            gameId,
            data.playerId,
            true,
            data.state,
          );
        } else {
          setRoomError(data.error || 'Could not join room');
        }
      } catch {
        window.history.replaceState({}, '', '/');
        setRoomError('Network error. Could not join room.');
      }
      setJoiningRoom(false);
    })();
  }, [initGame]);

  if (joiningRoom) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FEF7FF]">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <svg className="animate-spin h-8 w-8 text-material-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-material-onSurfaceVariant font-bold text-lg">Joining room...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center transition-all duration-1000 ease-in-out overflow-x-hidden"
      style={{
        background: !isPlaying ? '#FEF7FF' : playerBackgrounds[currentPlayer],
      }}
    >
      {roomError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-m3-lg shadow-m3-2 animate-in fade-in slide-in-from-top-2 max-w-[90vw]">
          <span className="text-sm font-bold">{roomError}</span>
          <button
            onClick={() => setRoomError(null)}
            className="text-red-400 hover:text-red-600 ml-2 shrink-0"
          >
            ✕
          </button>
        </div>
      )}
      <div className="w-full h-full flex flex-col items-center justify-center">
        {!isPlaying ? <Home /> : <Play />}
      </div>
    </div>
  );
}
