import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';

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
  const [vsComputer, setVsComputer] = useState(() => {
    const saved = localStorage.getItem('gameVsComputer');
    return saved === null ? true : saved === 'true';
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('gameMode', mode);
    localStorage.setItem('gameRows', rows.toString());
    localStorage.setItem('gameCols', cols.toString());
    localStorage.setItem('gameVsComputer', vsComputer.toString());
  }, [mode, rows, cols, vsComputer]);

  const start = () => {
    initGame(rows, cols, mode, vsComputer);
  };


  return (
    <div className="space-y-6">
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

        <div className="flex items-center justify-between p-3 rounded-m3-md bg-material-surfaceVariant/20 border border-material-outline/10">
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
        onClick={start} 
        className="m3-button-filled w-full text-lg py-4 shadow-m3-2 hover:shadow-m3-3"
      >
        Start Game
      </button>
    </div>
  );
}
