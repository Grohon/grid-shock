import React from 'react';
import Board from './Board';
import { useGameStore } from '../store';
import { PlayerID } from '../types';

export default function Play() {
  const { state, resetGame, clearGame, isAnimating } = useGameStore();
  const { gameOver, winner, currentPlayer, isOnline } = state;
  const [copied, setCopied] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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
    <div className="w-full h-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden relative">
      {/* Fixed Room ID for Mobile - prevents card jumping */}
      {isOnline && state.gameId && (
        <div className="fixed top-4 left-4 z-30 sm:static sm:p-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-material-outline/10 shadow-m3-1 transition-all active:scale-90 group"
          >
            <div className={`w-1.5 h-1.5 rounded-full ${state.connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : state.connectionStatus === 'waiting' ? 'bg-amber-500 animate-pulse' : state.connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-gray-400'}`} />
            <span className="text-[11px] font-black text-material-primary tracking-tight">
              {copied ? 'COPIED!' : 'ROOM: ' + state.gameId}
            </span>
          </button>
        </div>
      )}

      {/* Main HUD Card */}
      <div className="w-full max-w-2xl px-4 pt-4 pb-2 z-20">
        <div className="m3-card !p-3 flex items-center justify-between border border-material-outline/10 shadow-m3-1 bg-white/70 backdrop-blur-lg">
          <div className="flex items-center gap-4 flex-1">
            <div
              className={`w-4 h-4 rounded-full shadow-sm transition-colors duration-500 shrink-0 ${isAnimating ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: statusColor }}
            />
            
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-material-onSurfaceVariant/60 uppercase tracking-[0.2em] font-black">
                {gameOver ? 'MATCH ENDED' : (isAnimating ? 'CHAIN REACTION' : (isOnline ? 'ONLINE BATTLE' : 'LOCAL PASS & PLAY'))}
              </span>
              <span className="text-base font-bold text-material-onSurface truncate">
                {gameOver ? (
                  state.vsComputer && winner === state.computerPlayer ? "🤖 Bot Wins!" : `🏆 ${state.playerNames[winner as PlayerID]} Wins!`
                ) : (
                  isAnimating ? 'Exploding...' : (state.vsComputer && state.currentPlayer === state.computerPlayer ? "🤖 Bot is thinking..." : `${state.playerNames[state.currentPlayer]}'s Turn`)
                )}
              </span>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex gap-2">
            {gameOver && (
            <button
              onClick={() => resetGame()}
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

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex sm:hidden p-2 text-material-onSurfaceVariant hover:bg-black/5 rounded-full transition-all active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300" 
            onClick={() => setIsMenuOpen(false)} 
          />
          <div className="fixed top-4 right-4 w-48 bg-white rounded-m3-xl shadow-m3-3 z-50 p-3 space-y-2 animate-in slide-in-from-top-4 zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-3 pb-2 border-b border-material-outline/10">
              <span className="text-[10px] font-black text-material-onSurfaceVariant/40 uppercase tracking-widest">Controls</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-material-onSurfaceVariant hover:text-material-primary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {gameOver && (
              <button
                onClick={() => { resetGame(); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-material-primary/10 text-material-primary rounded-m3-lg text-sm font-bold transition-all active:scale-95"
              >
                <span>🏆</span> Play Again
              </button>
            )}
            <button
              onClick={() => { handleSettings(); setIsMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-material-onSurfaceVariant hover:bg-black/5 rounded-m3-lg text-sm font-bold transition-all active:scale-95"
            >
              <span>🏠</span> Main Menu
            </button>
          </div>
        </>
      )}

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
