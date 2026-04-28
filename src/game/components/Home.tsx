import React from 'react';
import ModeToggle from './ModeToggle';

export default function Home() {
  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-y-4 py-8 animate-in fade-in zoom-in duration-500">
      <header className="text-center flex flex-col gap-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-material-primary/20 rounded-full blur-2xl animate-pulse" />
            <img
              src="/grid-shock-128x128.png"
              alt="Grid Shock Logo"
              className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-3xl shadow-m3-3 animate-pop"
            />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-material-primary tracking-tight">
            Grid Shock
          </h1>
          <p className="text-material-onSurfaceVariant text-lg sm:text-xl font-medium">
            Strategy Meets Entropy
          </p>
        </div>
      </header>

      <main className="w-full max-w-md px-4 sm:px-0">
        <div className="m3-card shadow-m3-3 border border-material-outline/5 bg-white/60 backdrop-blur-xl">
          <h2 className="text-2xl font-bold mb-2 text-center text-material-onSurface">
            New Game
          </h2>
          <ModeToggle />
        </div>
      </main>

      <footer className="text-material-onSurfaceVariant/60 text-sm font-medium text-center">
        <p>
          <span>© 2025 Grid Shock. Developed by </span>
          <span><a href="https://github.com/grohon" target="_blank" className="text-material-primary hover:underline" rel="noopener noreferrer">Abu Foysal</a></span>
        </p>
      </footer>
    </div>
  );
}
