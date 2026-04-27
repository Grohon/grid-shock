import React from 'react';
import './Board.css';
import { useGameStore } from '../store';
import Cell from './Cell';

export default function Board() {
  const { state, attemptMove, isAnimating } = useGameStore();
  const { board } = state;

  const handleClick = (x: number, y: number) => {
    attemptMove(x, y);
  };

  return (
    <div className={`
      bg-white/30 backdrop-blur-sm p-3 rounded-m3-xl shadow-m3-2 inline-block transition-all
      ${isAnimating ? 'pointer-events-none cursor-wait' : ''}
    `}>


      <div className="flex flex-col gap-1">
        {board.map((row, i) => (
          <div key={i} className="flex gap-1">
            {row.map((cell, j) => (
              <Cell
                key={j}
                x={i}
                y={j}
                cell={cell}
                onClick={handleClick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
