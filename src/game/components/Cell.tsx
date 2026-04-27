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
        w-10 h-10 md:w-14 md:h-14 flex items-center justify-center
        rounded-m3-md cursor-pointer select-none transition-all duration-300
        ${owner ? playerColors[owner] : 'bg-material-surface text-material-onSurfaceVariant hover:bg-material-surfaceVariant'}
        ${count > 0 ? 'shadow-m3-1' : 'opacity-40'}
        ${isPopping ? 'animate-pop' : ''}
        active:scale-90 relative overflow-hidden
      `}
    >
      <div className={`
        flex flex-wrap gap-0.5 items-center justify-center p-1
        transition-all duration-300 ${count > 0 ? 'scale-100' : 'scale-0'}
      `}>
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-white/90 shadow-sm animate-pop" 
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>
    </div>
  );
}

