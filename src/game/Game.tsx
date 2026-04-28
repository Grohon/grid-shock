import React from 'react';
import { useEffect } from 'react';
import ModeToggle from './components/ModeToggle';
import Board from './components/Board';
import { useGameStore } from './store';

export default function Game() {
  const { state, resetGame, clearGame, isAnimating } = useGameStore();
  const { gameOver, winner, currentPlayer, rows } = state;

  const handleSettings = () => {
    clearGame();
  };

  const playerBackgrounds = {
    1: 'linear-gradient(135deg, #F3EFFF 0%, #EADDFF 100%)',
    2: 'linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)',
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-1000 ease-in-out"
      style={{ 
        background: rows === 0 ? '#FEF7FF' : playerBackgrounds[currentPlayer],
      }}
    >

      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-5xl md:text-6xl font-bold text-material-primary tracking-tight">Grid Shock</h1>
          <p className="text-material-onSurfaceVariant text-lg">A game of tactical chain reactions</p>
        </header>


        <main className="flex flex-col items-center">
          {rows === 0 ? (
            <div className="m3-card w-full max-w-md shadow-m3-3">
              <h2 className="text-2xl font-bold mb-6 text-center text-material-onSurface">New Game</h2>
              <ModeToggle />
            </div>
          ) : (
            <div className="space-y-6 w-full flex flex-col items-center">
              <div className="m3-card w-full max-w-2xl flex flex-wrap items-center justify-between gap-4 border border-material-outline/10">
                <div className="flex items-center gap-4">
                  <div 
                    className={`w-6 h-6 rounded-full shadow-m3-1 ${isAnimating ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: currentPlayer === 1 ? '#6750A4' : '#006A6A' }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm text-material-onSurfaceVariant uppercase tracking-wider font-bold">
                      {gameOver ? 'Game Over' : (isAnimating ? 'Chain Reaction' : 'Current Turn')}
                    </span>
                    <span className="text-xl font-bold text-material-onSurface">
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
                    <button onClick={resetGame} className="m3-button-filled">
                      Play Again
                    </button>
                  )}
                  <button onClick={handleSettings} className="m3-button-outline">
                    Settings
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <Board />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
