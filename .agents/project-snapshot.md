# Grid Shock — Project Snapshot

## 1. Project Overview

- **Name**: Grid Shock (pkg: `grid-shock`)
- **Purpose**: Tactical, turn-based chain reaction board game. Players place atoms on a grid; overloaded cells explode and convert neighbors. Goal: own the entire board.
- **Core Features**:
  - 2–4 player local (pass & play) or online (Vercel server-based)
  - vs Computer (Minimax AI, depth 3)
  - Two modes: Classic (dynamic thresholds) & Fixed (threshold = 4)
  - Grid size configurable 3×3 to 10×10
  - PWA with offline support
  - Persistent stats, player names (localStorage) and settings
  - Material 3 design with Tailwind CSS
  - Last-move outline highlight for turn clarity
  - Public room listing with auto-refresh
  - URL-based room joining (`/room/blue-fox-42`)
  - Sound effects + haptic feedback (Web Audio API + Vibration API)
  - Disconnect detection (auto-abandon on stale polling)
- **Status**: Active

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5 |
| Framework | React 18 |
| Styling | Tailwind CSS 4 + PostCSS |
| State | Zustand 4 |
| Build | Vite 5 + @vitejs/plugin-react |
| PWA | vite-plugin-pwa (Workbox) |
| Networking | Vercel API routes + Upstash Redis via direct `fetch()` (polling-based) |
| Linting | ESLint 9 (flat config) + typescript-eslint + react-hooks + react-refresh |
| Testing | Vitest 0.34 + jsdom |
| Deploy | Vercel |

## 3. Architecture Summary

- **Type**: Client-side SPA + Vercel serverless API routes
- **Networking**: REST API (`api/game/*`) + polling (300ms interval); game state in Upstash Redis via direct `fetch()` (REST API) with in-memory `Map` fallback
- **State**: Single Zustand store (`useGameStore`) holds all game state; polling managed via setInterval outside store
- **Data Flow**:
  1. User clicks cell → `attemptMove()` in store
  2. Engine validates move, applies it, computes explosion steps
  3. Steps animated sequentially (500ms delay), plays sound per step
  4. Win check → player switch (skips eliminated players) → win/lose sound
   5. If online: move submitted to server (fire-and-forget) for persistence & sync
    6. Both clients poll `GET /api/game/state?id=X&playerId=X` every 300ms; remote moves animated on detection

## 4. Directory & Code Structure

```
D:\laragon\www\color-wars\
├── api\
│   └── game\
│       ├── state.ts           # GET /api/game/state?id=X&playerId=X — poll + track lastPoll
│       ├── create.ts          # POST /api/game/create — host creates room (word-based ID)
│       ├── join.ts            # POST /api/game/join — joiner joins room
│       ├── move.ts            # POST /api/game/move — submit a move
│       ├── name.ts            # POST /api/game/name — update player name
│       ├── leave.ts           # POST /api/game/leave — mark game abandoned
│       ├── reset.ts           # POST /api/game/reset — reset game (any player)
│       └── rooms.ts           # GET /api/game/rooms — list active rooms (uses game:index key)
├── src\
│   ├── main.tsx              # Entry point, registers SW, renders <Game>
│   ├── index.css             # Tailwind + Material 3 + custom animations
│   ├── vite-env.d.ts         # Type declarations for virtual:pwa-register
│   └── game\
│       ├── Game.tsx           # Root: URL join, reconnect, address bar, bg transition
│       ├── types.ts           # PlayerID, Cell, Board, GameState interfaces
│       ├── store.ts           # Zustand store + fetch-based networking + polling
│       ├── engine.ts          # Core logic: thresholds, moves, explosions, AI (Minimax)
│       ├── lib\
│       │   └── sound.ts       # Web Audio API tones + Vibration API + mute toggle
│       └── components\
│           ├── Home.tsx       # Landing page, renders ModeToggle
│           ├── ModeToggle.tsx # Setup UI: mode, grid, players, names, room list, create/join
│           ├── Play.tsx       # In-game HUD: status, reset, menu, room link, mute toggle
│           ├── Board.tsx      # Renders board grid of Cell components + last-move outline
│           ├── Cell.tsx       # Single cell: atoms display, click handler, pop animation
│           └── Board.css      # Empty (styles moved to Tailwind)
├── server.ts                  # Standalone Node.js production server
├── .agents\
│   ├── AGENTS.md              # Agent rules + architecture notes
│   └── project-snapshot.md    # This file
├── .env.example               # Upstash Redis env vars template
├── public\
│   ├── manifest.json          # PWA manifest
│   ├── sw.js / workbox-*.js  # Generated SW (dev-dist/)
│   └── grid-shock-*.png      # App icons (128/192/512)
├── eslint.config.js           # ESLint flat config
├── vite.config.ts             # Vite + React + PWA plugin + apiRoutesPlugin (dev)
├── tailwind.config.cjs        # Material 3 color tokens, shadows, radii
├── tsconfig.json              # Strict TS, jsx: react-jsx
├── vitest.config.ts           # Vitest + jsdom environment
└── vercel.json               # SPA rewrite: /room/:id + catch-all → index.html
```

## 5. Storage

**Upstash Redis** — online multiplayer state:
- Key: `game:{gameId}` → value: `GameState` (full serialized state, including `lastPoll`)

**localStorage** — client-only persistence:
- `gs_playerNames`: `Record<number, string>` — all player names
- `gs_stats`: `{ wins: number, losses: number }`
- `gs_muted`: `"true" | "false"` — sound mute toggle
- `gameMode`, `gameRows`, `gameCols`, `gameNumPlayers`, `gameVsComputer`, `gameIsOnline`: Settings

**sessionStorage** — reconnect persistence:
- `gs_session`: `{ gameId, playerId, isOnline }` — survives page refresh

## 6. API & Interfaces

REST API at `/api/game/*`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/game/create` | POST | Host creates a game → returns `{ gameId, playerId: 1, state }` |
| `/api/game/join` | POST | Joiner joins a game → returns `{ playerId, state }` |
| `/api/game/move` | POST | Submit a move → returns `{ state }` |
| `/api/game/reset` | POST | Reset the game board (any player) |
| `/api/game/leave` | POST | Mark game as abandoned |
| `/api/game/name` | POST | Update player name |
| `/api/game/rooms` | GET | List active (non-full, non-game-over) rooms |
| `/api/game/state` | GET | Poll current game state; `?id=X&playerId=X` tracks `lastPoll` |

### Move Flow (Online)
1. Client places atom locally + animates explosions (same as local)
2. After animation, submits `{ gameId, playerId, x, y }` to `/api/game/move`
3. Server validates move, resolves explosions, stores authoritative state
4. Both clients poll `GET /api/game/state?id=X&playerId=X` every 300ms
5. Polling detects remote moves via `lastMove` change → reconstructs placed state → animates explosions

### Room URL Flow
1. Host creates game → address bar updates to `/room/blue-fox-42`
2. Host shares link; joiner opens `/room/blue-fox-42`
3. `Game.tsx` join effect detects URL match → `POST /api/game/join` → `initGame`
4. On page refresh: `sessionStorage` holds `{ gameId, playerId }` → reconnects via `GET /api/game/state?id=X&playerId=X` (no re-join)
5. Leaving (Menu): `sendBeacon` to `POST /api/game/leave` → other player sees "Opponent left" (poll detects tab close)

### Disconnect Detection
- Each poll sends `?playerId=X` → server updates `state.lastPoll[playerId] = Date.now()`
- Server checks all other players' `lastPoll` timestamps; if >10s stale, sets `abandoned=true`
- Client syncs `abandoned` flag via polling → hides "Play Again" + shows "Opponent left"

## 7. Key Business Logic

### Core Rules (`src/game/engine.ts`)
- **Thresholds**: Classic mode = neighbor count (corner=2, edge=3, interior=4); Fixed mode = always 4
- **Valid move**: Classic — empty or owned cell; Fixed — first move must be empty, thereafter only owned cells
- **Explosions**: When `cell.count >= threshold`, cell loses `threshold` atoms, each neighbor gains 1 atom and is taken over by current player
- **Chain reaction**: All explosions in a "wave" resolve simultaneously; repeats until stable
- **Win**: Single owner on board with >1 owned cell; early single-cell moves don't count as wins

### AI (`getComputerMove`)
- Minimax with Alpha-Beta pruning, depth 3
- Evaluation: cell ownership (+100), atom count (+10/cell), strategic bonuses (corners > edges in classic, clustering in fixed)
- Move ordering: prioritizes critical cells (count === threshold - 1)

### Player Rotation
- Skips players who have placed initial block but own 0 cells (eliminated)
- `initialPlaced` record tracks first placement per player (Fixed mode enforcement)

### Online Mode Rules
- **Host** (Player 1) always starts first (no random)
- Game state stored in Upstash Redis via direct `fetch()` REST API; polling interval 300ms with `?id=X&playerId=X`
- Remote moves animated on joiner side via reconstructed placed state + `getExplosionSteps`
- Names synced via `POST /api/game/name` on change; server names are authoritative
- Joiner's name comes from profile input (`playerNames[1]`) — not hardcoded to player 2
- Room list auto-refreshes every 5s using `game:index` key; full rooms filtered out
- Abandon detection: leave endpoint + stale poll check (>10s)
- Reconnect: `sessionStorage` persists identity across refresh

### Sound (`src/game/lib/sound.ts`)
- `playClick()`: square wave 800Hz 50ms + vibrate 10ms
- `playExplosion(intensity)`: sawtooth 120Hz/60Hz 150-250ms + vibrate 30ms×intensity
- `playWin()`: ascending C5-E5-G5 sine tones + vibrate pattern
- `playLose()`: descending D5-C5 sine tones + vibrate 100ms
- Mute persisted in `gs_muted` localStorage; toggle in Play toolbar and mobile menu

## 8. Environment & Setup

### Prerequisites
- Node.js ≥ 18
- Upstash Redis (optional — in-memory fallback for dev)

### Commands
| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server (opens browser) — includes API routes |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | Run ESLint on all source files |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest |
| `npm start` | Standalone production server (`tsx server.ts`) |

### Environment Variables (for Upstash Redis)
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
Without these, game state uses in-memory `Map` per handler (volatile, per-instance on Vercel; shared within process for `npm start`).

### Local Dev (Online Multiplayer)
`npm run dev` serves both frontend + API routes via `apiRoutesPlugin` Vite plugin.
No separate server needed. For production-like testing, run `npm run build && npm start` or use `vercel dev`.

## 9. Current State & Progress

### Completed
- ✅ Core game engine (moves, explosions, win detection)
- ✅ Classic + Fixed game modes
- ✅ 2–4 player local pass & play
- ✅ vs Computer with Minimax AI
- ✅ Online multiplayer via Vercel serverless API (Upstash Redis)
- ✅ PWA offline support
- ✅ Persistent player names (all players) and stats (localStorage)
- ✅ Material 3 UI with Tailwind 4
- ✅ Responsive design (mobile + desktop)
- ✅ ESLint setup (flat config, typescript-eslint, react-hooks)
- ✅ Last-move outline highlight on board
- ✅ Migrated from PeerJS P2P to server-based architecture
- ✅ Public room listing with auto-refresh (300ms game poll / 5s room list)
- ✅ Server-authoritative player name sync
- ✅ URL-based room joining (`/room/:id` + vercel rewrite)
- ✅ Human-readable room IDs (adjective-noun-XX)
- ✅ Reconnect flow (sessionStorage survives page refresh)
- ✅ Leave detection (sendBeacon on Menu / tab close)
- ✅ Disconnect detection (stale poll >10s auto-abandons)
- ✅ Any player can reset (not host-only)
- ✅ Polling continues after gameOver for reset detection
- ✅ Fix pass-and-play (localPlayerId undefined for local games)
- ✅ Sound effects + haptic feedback + mute toggle
- ✅ Migrate @vercel/kv → direct fetch() to Upstash Redis REST API
- ✅ All 8 API handlers as single self-contained files (no cross-file imports for Vercel)
- ✅ Standalone Node.js production server (`server.ts`)

### In Progress
- None

### Known Issues
- `minimax()` multiplayer AI treats turn-taker as "current" (simplified, engine.ts:306)
- `initialPlaced` duplication: set in both store.ts `attemptMove` and engine.ts `makeMove` (both correct)
- No tests exist (`src/**/*.test.*` — empty)
- WebSocket server code in `server.ts`/`vite.config.ts` is unused client-side (Vercel incompatible); kept for standalone server mode

## 10. Pending Tasks / Roadmap

- Add unit tests for engine (thresholds, explosions, win detection)
- Leaderboard or match history beyond localStorage
- In-game chat or emoji reactions for online mode
- Better animations (smooth CSS transitions instead of step-based)

## 11. Agent Notes (CRITICAL)

### Assumptions Not to Break
- `GameState.initialPlaced` is a `Record<PlayerID, boolean>` — required for Fixed mode enforcement
- `GameState.lastMove` is `{ x, y, player?: PlayerID } | undefined` — tracks last cell for outline highlight & remote move detection
- `localPlayerId` is `undefined` for pass-and-play, set for online — the `isOurTurn` check in `attemptMove` relies on this
- `isAnimating` flag prevents input during explosion animations — **do not** bypass
- Polling interval is 300ms — don't change without considering server load
- Remote moves are animated by reconstructing placed state from previous board + lastMove coordinates
- `prevMoveKey` tracks the last-seen `lastMove` key; reset to `''` on server reset
- Server is authoritative for **all** player names; local state must not override other players' names
- Join effect in Game.tsx must run BEFORE address bar effect (effects are order-dependent)
- `processedRoomRef` prevents the join effect from re-firing for the same room

### Sensitive Areas
- **`src/game/store.ts`**: Zustand store + polling logic — changing state shape breaks sync
- **`src/game/engine.ts`**: Core game rules — changing thresholds or explosion logic changes game behavior
- **`src/game/types.ts`**: `PlayerID` is constrained to `1 | 2 | 3 | 4` — expanding requires updates across engine + store
- **`api/game/move.ts`**: Server-side move validation — must match engine rules exactly
- **`vite.config.ts`** `apiRoutesPlugin`: Must keep route table in sync with `api/game/*` files
- **`src/game/Game.tsx`**: Effect ordering matters — join (first) → address bar
- **`src/game/lib/sound.ts`**: AudioContext created on first user interaction (browser policy)

### Files That Must Update Together
- `types.ts` → `engine.ts` → `store.ts` (core game flow)
- `tailwind.config.cjs` colors (`material.player1-4`) ↔ `Cell.tsx` playerColors ↔ `Game.tsx` playerBackgrounds
- `vite.config.ts` PWA manifest ↔ `public/manifest.json` (must stay in sync)
- `api/game/*.ts` ↔ `src/game/engine.ts` (server must mirror client engine logic)
- `vite.config.ts` route table ↔ `api/game/*` files (add new API routes to both)
- `vercel.json` rewrites ↔ `vite.config.ts` room fallback middleware (must both handle `/room/:id`)

### Common Pitfalls
- Polling continues until `clearGame()` — always call `clearGame()` when leaving online game
- `attemptMove` is `async` due to animation delays — callers must not assume immediate state update
- Fixed mode: first placement per player must be on empty cell; engine enforces this via `initialPlaced`
- `checkWin` ignores single-cell ownership to prevent false win on opening move (engine.ts:120)
- `gs_playerNames` stores **all** player names as a `Record<number, string>` in localStorage — not just local player
- Without Upstash env vars, game state is **volatile** (in-memory only, per-function-instance)
- Server move handler mutates state object — always clone before writing to KV
- Remote move animation reconstructs placed state from previous board — ensure `lastMove.player` is set correctly
- Joiner's name is sent from `playerNames[1]` (profile input) — don't change to `playerNames[2]` without updating the join flow
- `server.ts` route patterns must match `apiRoutesPlugin` in vite.config.ts
- `localPlayerId` must be `undefined` for pass-and-play — if set to 1, the `isOurTurn` check blocks other players
- Each API handler is self-contained (no imports) — Vercel `@vercel/node` builder cannot resolve cross-file imports
- Upstash accessed via direct `fetch()` to `${UPSTASH_URL}/get/...` and `POST ${UPSTASH_URL}/set/...` — `d.result` is a JSON string, must `JSON.parse()`
- Room ID regex in Game.tsx: `/^\/room\/([a-z]+-[a-z]+-\d{2})$/` — must match the format generated in create.ts
- Web Audio API requires user gesture to create first AudioContext (handled by lazy init in sound.ts)
