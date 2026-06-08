# AGENTS.md

## Rules

- **NEVER** push git commits to the remote repository (`git push`) unless explicitly instructed by the user.
- Always run `npm run lint` after making code changes to verify ESLint passes.
- Fix any lint errors before considering a task complete.
- After lint, also run `npx tsc --noEmit` and `npm run build` to verify type safety and compilation.

## Architecture Notes

### Server-based Online Multiplayer (Vercel)
- PeerJS P2P removed; replaced with Vercel API routes (`api/game/*`)
- Game state stored in **Upstash Redis** via direct `fetch()` to REST API (`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` env vars) with in-memory `Map` fallback for dev
- **Host** (Player 1): calls `POST /api/game/create` → gets `gameId` (human-readable, e.g. `blue-fox-42`)
- **Joiner**: clicks room link (`/room/blue-fox-42`), sees room list, or enters code → `POST /api/game/join`
- **Moves**: client animates locally, then submits to `POST /api/game/move` (fire-and-forget)
- **Sync**: both clients poll `GET /api/game/state?id=X&playerId=X` every **1s**; remote moves animated on detection
- **Reset**: `POST /api/game/reset` — any player can trigger (no longer host-only)
- **Leave**: `POST /api/game/leave` sets `abandoned=true` — sent via `sendBeacon` on Menu click (poll-based disconnect detection handles tab close)
- **Names**: `POST /api/game/name` syncs player names; server names are **authoritative**
- **Disconnect detection**: server tracks `lastPoll` timestamps per `playerId`; if opponent's poll is >10s stale, auto-sets `abandoned=true`

### Room URLs & Reconnect
- Room links: `https://host/room/blue-fox-42` — Vercel rewrite `/room/:id` → `/index.html`, Vite dev middleware rewrites `/room/*` → `/`
- `Game.tsx` join effect (runs BEFORE address bar effect) reads `window.location.pathname`, matches `/room/:id`, and auto-joins
- Reconnect: `sessionStorage` stores `{ gameId, playerId }` on create/join. On page refresh, join effect checks for stored session and re-inits via `GET /api/game/state?id=X&playerId=X` instead of re-joining
- `processedRoomRef` prevents the join effect from firing twice for the same room

### Polling & Remote Move Animation
- `startPolling()` in store.ts runs a 1s interval when online
- Detects remote moves via `lastMove` comparison + `prevMoveKey` tracking
- `serverReset` flag detects game resets (`lastMove` becomes undefined)
- `gameOverChanged` flag detects game-over status flips
- `abandonedChanged` flag detects opponent disconnect
- Reconstructs placed state from previous board + `lastMove` coordinates
- Runs `getExplosionSteps` for animation on remote moves
- Final state always synced to canonical server state (names included)

### Room Listing
- `GET /api/game/rooms` returns active rooms (not full, not game-over)
- Polled every 5s in the Join view
- Rooms filtered out when `filledSlots >= numPlayers`
- Host name, mode badge, grid size, and player count displayed per room

### Player Name Flow
- Host sets name in profile input → sent to server on create
- Joiner sets name in **same profile input** (`playerNames[1]`) → sent to server on join
- Server stores name under the assigned `playerId`
- All clients trust `serverState.playerNames` as authoritative (no local override of other players' names)
- `setPlayerName()` sends `POST /api/game/name` to propagate changes

### Local Development
- `npm run dev` serves both frontend AND API routes natively (via Vite plugin `apiRoutesPlugin` in `vite.config.ts`)
- No separate server needed; plugin uses `server.ssrLoadModule()` to load `.ts` API handlers
- Polyfills Vercel's `res.status().json()` on the Connect response; parses URL query params for `req.query`
- Without Upstash env vars, the API falls back to in-memory store (per-instance, volatile)
- For production-like testing, run `npm run build && npm start` (standalone `server.ts` with built-in `http` module) or `vercel dev`
- `server.ts` serves `dist/` static files + API routes + SPA fallback using only Node built-in modules (zero external deps)

### Environment Variables (for Upstash Redis)
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
