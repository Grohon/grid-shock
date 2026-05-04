/* eslint-disable react-hooks/set-state-in-effect -- pop animation trigger */
import React from 'react';
import { Cell as CellType, PlayerID } from '../types';

interface Props {
  x: number;
  y: number;
  cell: CellType;
  onClick: (x: number, y: number) => void;
}

const playerColors: Record<PlayerID, string> = {
  1: 'bg-material-player1 text-material-onPrimary',
  2: 'bg-material-player2 text-white',
  3: 'bg-material-player3 text-material-onSurface',
  4: 'bg-material-player4 text-white',
};

export default function Cell({ x, y, cell, onClick }: Props) {
  const { owner, count } = cell;
  const [isPopping, setIsPopping] = React.useState(false);

  React.useEffect(() => {
    if (count > 0) {
      setIsPopping(true);
      const timer = setTimeout(() => setIsPopping(false), 300);
      return () => clearTimeout(timer);
    }
  }, [count]);
  
  return (
    <div 
      onClick={() => onClick(x, y)}
      className={`
        aspect-square flex items-center justify-center
        rounded-m3-xs sm:rounded-m3-sm cursor-pointer select-none transition-all duration-300
        border border-black/20 shadow-sm
        ${owner ? playerColors[owner] : 'bg-material-surface/60 text-material-onSurfaceVariant hover:bg-material-surfaceVariant'}
        ${count > 0 ? 'opacity-100 ring-1 ring-white/30' : 'opacity-40'}
        ${isPopping ? 'animate-pop' : ''}
        active:scale-95 relative overflow-hidden
      `}
    >
      <div className="flex flex-wrap gap-1 items-center justify-center p-1">
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 rounded-full bg-white shadow-m3-1 animate-pop" 
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>
    </div>
  );
}
