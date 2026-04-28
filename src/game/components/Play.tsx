import React from 'react';
import Board from './Board';
import { useGameStore } from '../store';

export default function Play() {
  const { state, resetGame, clearGame, isAnimating } = useGameStore();
  const { gameOver, winner, currentPlayer } = state;

  const handleSettings = () => {
    clearGame();
  };

  const statusColor = currentPlayer === 1 ? '#6750A4' : '#006A6A';

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
              <span className="text-[10px] text-material-onSurfaceVariant uppercase tracking-[0.1em] font-bold">
                {gameOver ? 'Game Over' : (isAnimating ? 'Processing' : 'Turn')}
              </span>
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
              Menu
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
