import React from 'react';
import Board from './Board';
import { useGameStore } from '../store';

export default function Play() {
  const { state, resetGame, clearGame, isAnimating } = useGameStore();
  const { gameOver, winner, currentPlayer } = state;
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (state.gameId) {
      navigator.clipboard.writeText(state.gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSettings = () => {
    clearGame();
  };

  const statusColors = {
    1: '#6750A4',
    2: '#006A6A',
    3: '#FFB300',
    4: '#D81B60',
  };
  const statusColor = statusColors[currentPlayer];

  return (
    <div className="w-full h-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Compact HUD */}
      <div className="w-full max-w-2xl px-4 pt-4 pb-2">
        <div className="m3-card !p-3 flex items-center justify-between gap-4 border border-material-outline/10 shadow-m3-1 bg-white/70 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full shadow-sm transition-colors duration-500 ${isAnimating ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: statusColor }}
            />
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-material-onSurfaceVariant uppercase tracking-[0.1em] font-bold">
                  {gameOver ? 'Game Over' : (isAnimating ? 'Processing' : 'Turn')}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 bg-material-primary/5 hover:bg-material-primary/15 px-2 py-0.5 rounded-full transition-all active:scale-90 group relative"
                  title="Copy Invite Code"
                >
                  <span className="text-[13px] text-material-primary font-black tracking-tight">
                    {copied ? 'Copied!' : 'ID: ' + state.gameId}
                  </span>
                  {!copied ? (
                    <svg className="w-3.5 h-3.5 text-material-primary/50 group-hover:text-material-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-green-600 animate-in zoom-in duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Connection Status Indicator */}
                {state.connectionStatus && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      state.connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                      state.connectionStatus === 'connecting' ? 'bg-amber-500 animate-bounce' :
                      state.connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-material-outline/30'
                    }`} />
                    <span className="text-[9px] font-bold text-material-onSurfaceVariant/60 uppercase tracking-widest">
                      {state.connectionStatus === 'connected' ? 'Online' : state.connectionStatus}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-base font-bold text-material-onSurface">
                {gameOver ? (
                  state.vsComputer && winner === state.computerPlayer ? "Bot Wins!" : `Player ${winner} Wins!`
                ) : (
                  isAnimating ? 'Exploding...' : (state.vsComputer && currentPlayer === state.computerPlayer ? "Bot" : `Player ${currentPlayer}`)
                )}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {gameOver && (
              <button
                onClick={resetGame}
                className="bg-material-primary text-material-onPrimary px-4 py-1.5 rounded-m3-lg text-sm font-bold shadow-m3-1 hover:shadow-m3-2 transition-all active:scale-95"
              >
                Again
              </button>
            )}
            <button
              onClick={handleSettings}
              className="border border-material-outline/30 text-material-onSurfaceVariant px-4 py-1.5 rounded-m3-lg text-sm font-bold hover:bg-black/5 transition-all active:scale-95"
            >
              Main Menu
            </button>
          </div>
        </div>
      </div>

      {/* Emphasized Board Area */}
      <div className="flex-1 flex items-center justify-center w-full px-2 sm:px-4 py-4 overflow-hidden">
        <div className="w-full max-w-2xl flex justify-center items-center">
          <Board />
        </div>
      </div>

      {/* Mobile-friendly subtle footer info */}
      {!gameOver && (
        <div className="pb-6 text-[10px] text-material-onSurfaceVariant/40 font-bold uppercase tracking-widest">
          Tap a cell to shock
        </div>
      )}
    </div>
  );
}
