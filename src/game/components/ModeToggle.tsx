import React, { useState } from 'react';
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

  const [errors, setErrors] = useState<{ rows?: string; cols?: string }>({});

  // Save settings to localStorage when they change
  React.useEffect(() => {
    localStorage.setItem('gameMode', mode);
    localStorage.setItem('gameRows', rows.toString());
    localStorage.setItem('gameCols', cols.toString());
  }, [mode, rows, cols]);


  const validate = () => {
    const newErrors: { rows?: string; cols?: string } = {};
    if (rows < 3 || rows > 10) newErrors.rows = 'Must be between 3 and 10';
    if (cols < 3 || cols > 10) newErrors.cols = 'Must be between 3 and 10';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const start = () => {
    if (validate()) {
      initGame(rows, cols, mode);
    }
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

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-material-onSurfaceVariant ml-1">
              Rows
            </label>
            <input 
              className={`m3-input ${errors.rows ? 'border-red-500' : ''}`}
              type="number" 
              min={3} 
              max={10}

              value={rows} 
              onChange={e => {
                setRows(Number(e.target.value));
                if (errors.rows) setErrors(prev => ({ ...prev, rows: undefined }));
              }} 
            />
            {errors.rows && (
              <span className="text-xs text-red-500 ml-1">{errors.rows}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-material-onSurfaceVariant ml-1">
              Columns
            </label>
            <input 
              className={`m3-input ${errors.cols ? 'border-red-500' : ''}`}
              type="number" 
              min={3} 
              max={10}

              value={cols} 
              onChange={e => {
                setCols(Number(e.target.value));
                if (errors.cols) setErrors(prev => ({ ...prev, cols: undefined }));
              }} 
            />
            {errors.cols && (
              <span className="text-xs text-red-500 ml-1">{errors.cols}</span>
            )}
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
