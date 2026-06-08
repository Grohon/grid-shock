# Grid Shock

Tactical turn-based chain reaction game. Place atoms on a grid, overload cells to trigger explosions and convert enemies' cells. Last player standing wins.

Built with **React**, **TypeScript**, **Tailwind CSS 4**, **Zustand**, and **Vite**. Deployed on **Vercel** with **Upstash Redis** (direct `fetch()` REST API) for online multiplayer state.

## How to Play

1. **Place**: Click a cell you own (or empty in Classic mode) to add an atom.
2. **Explode**: When a cell reaches its threshold (corner=2, edge=3, interior=4; or 4 in Fixed mode), it explodes — each neighbor gains an atom and is taken over.
3. **Chain**: Explosions cascade wave-by-wave until stable.
4. **Win**: Own every non-empty cell on the board.

Play **local pass-and-play** (2–4 players), **vs Computer**, or **online** via shareable room links.

## Features

- **Online Multiplayer**: Vercel serverless + Upstash Redis. Share a room link (`/room/blue-fox-42`) — no account needed.
- **Room Listing**: Browse active public rooms and join with one click.
- **vs Computer**: Minimax AI (depth 3) with alpha-beta pruning.
- **Two Modes**: Classic (dynamic thresholds by position) or Fixed (threshold always 4).
- **Custom Grid**: 3×3 up to 10×10.
- **Reconnect**: Page refresh preserves your game via `sessionStorage`.
- **Disconnect Detection**: Opponent tab closed? Auto-abandons after 10s of silence.
- **Sound & Haptics**: Web Audio tones + Vibration API. Mute toggle persisted to `localStorage`.
- **PWA**: Installable, works offline.
- **Persistent Settings**: Player names, stats (wins/losses), and game preferences saved locally.
- **Material 3 UI**: Responsive, glassmorphism, last-move highlight.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Zustand 4 |
| Styling | Tailwind CSS 4 + PostCSS |
| Build | Vite 5 + @vitejs/plugin-react |
| Backend | Vercel serverless functions (API routes) |
| Database | Upstash Redis (in-memory fallback for dev) |
| PWA | vite-plugin-pwa (Workbox) |
| Linting | ESLint 9 (flat config), typescript-eslint |
| Testing | Vitest + jsdom |

## Quick Start

```bash
# install
npm install

# dev (frontend + API routes)
npm run dev

# lint + typecheck + build
npm run lint
npx tsc --noEmit
npm run build

# test
npm run test
```

### Environment Variables (optional)

For persistent online multiplayer across restarts, add to `.env.local`:

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Without these, game state is in-memory (volatile, per-dev-server).

## API

REST endpoints at `/api/game/*`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/game/create` | POST | Host creates a room |
| `/api/game/join` | POST | Join a room |
| `/api/game/move` | POST | Submit a move |
| `/api/game/reset` | POST | Reset the board |
| `/api/game/leave` | POST | Mark game abandoned |
| `/api/game/name` | POST | Update player name |
| `/api/game/rooms` | GET | List active rooms |
| `/api/game/state` | GET | Poll game state (`?id=X&playerId=X`) |

## Room URLs

Rooms use human-readable IDs like `blue-fox-42`. Share links work as:
- `https://your-app.vercel.app/room/blue-fox-42`

The joiner opens the link and auto-joins. On refresh, `sessionStorage` reconnects without re-joining.

## Project Structure

```
src/
├── game/
│   ├── Game.tsx              # Root: URL join, reconnect, effects
│   ├── store.ts              # Zustand store + polling networking
│   ├── engine.ts             # Core game rules + Minimax AI
│   ├── types.ts              # TypeScript interfaces
│   ├── lib/sound.ts          # Web Audio API + haptics
│   └── components/
│       ├── ModeToggle.tsx    # Setup UI + room list
│       ├── Play.tsx          # In-game HUD
│       ├── Board.tsx         # Grid rendering
│       └── Cell.tsx          # Single cell
api/
└── game/                     # Vercel serverless handlers (self-contained files)
    ├── create.ts, join.ts, move.ts, reset.ts
    ├── leave.ts, name.ts, rooms.ts, state.ts
```

## License

MIT — see [LICENSE](LICENSE).
