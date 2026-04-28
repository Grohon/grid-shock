import React from 'react';
import { createRoot } from 'react-dom/client';
import Game from './game/Game';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline support
registerSW({ immediate: true });


const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Game />
    </React.StrictMode>
  );
}
