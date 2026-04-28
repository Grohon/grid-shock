import React from 'react';
import Home from './components/Home';
import Play from './components/Play';
import { useGameStore } from './store';

export default function Game() {
  const { state } = useGameStore();
  const { rows, currentPlayer } = state;

  const playerBackgrounds = {
    1: 'linear-gradient(135deg, #F3EFFF 0%, #EADDFF 100%)',
    2: 'linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)',
  };

  const isPlaying = rows > 0;

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center transition-all duration-1000 ease-in-out overflow-x-hidden"
      style={{
        background: !isPlaying ? '#FEF7FF' : playerBackgrounds[currentPlayer],
      }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center">
        {!isPlaying ? <Home /> : <Play />}
      </div>
    </div>
  );
}
