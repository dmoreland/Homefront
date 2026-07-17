# Home Front — WW2 industrial idle game

A Hearts of Iron 4-inspired idle/clicker. Currently v1: United Kingdom only, a React (Vite) app. Prototyped in Claude.ai as a single file, since split into pure game logic, a `useGameEngine` hook, and presentational components.

## How to run
```
npm install
npm run dev     # local dev server
npm test        # vitest unit + render tests
npm run build   # production build
```
Deploy: GitHub Pages via `.github/workflows/deploy.yml` (static Vite build, no backend); live at https://dmoreland.github.io/Homefront/.

## Project layout
- `src/data/gameData.js` — all balance tables (GENERATORS, LINES, FORCES, THEATRES, UPGRADES, RES, FRESH).
- `src/game/` — pure, unit-tested logic: `simulate.js` (the game step), `economy.js` (cost scaling/affordability), `missions.js` (theatre resolution), `offline.js` (offline earnings), `saveStore.js` (persistence adapter). Co-located `*.test.js` files.
- `src/hooks/useGameEngine.js` — owns state and the impure lifecycle (tick, autosave, load/offline, actions). The one place timers/storage/toasts live.
- `src/components/` — presentational pieces (Scene, ResourceBar, GeneratorList, ProductionLines, ForcesList, Theatres, WarCabinet, Foundry, Header, Footer, Toast).
- `src/ui/` — shared `format.js` (fmt, costStr) and `styles.js`.
- `src/App.jsx` — composition only.

## Core design
Two-stage production chain (the HOI4 hook — resources do NOT buy units directly):
1. **Raw resources** (steel, aluminium, oil, rubber, manpower) from generators; UK gets a passive Empire trickle of +0.2 oil & rubber/sec.
2. **Production lines** CONSUME resources per second to make equipment (rifles, artillery, tanks, fighters, warships). Lines throttle proportionally when starved and show STALLED %.
3. **Forces** recruited from equipment + manpower: infantry/armoured divisions, air wings, fleets. Air & fleets have oil upkeep.
4. **Theatres** (Battle of Britain / Atlantic / North Africa): commit forces to timed operations. Victory returns forces, grants stacking resource bonuses + War Score. Stage requirements scale ×2 per victory, duration ×1.3.
5. **War Score** is spent in the War Cabinet: conscription laws (manpower ×2/×4/×8), Radar (air/naval ops 25% faster).

## Architecture notes
- `simulate(state, dt)` (in `src/game/simulate.js`) is the PURE game step — used by the 250ms tick AND offline earnings (50% rate, 8h cap). Keep it pure; all balance lives in the data tables in `src/data/gameData.js`. Mission and offline resolution are likewise pure (`game/missions.js`, `game/offline.js`) and unit-tested.
- Resource bar shows NET flow (gen − line consumption − upkeep); deficit cards go red with ▼. Consumption is measured at current throttle, so a fully stalled line under-reports its theoretical demand.
- Missions store absolute `endsAt` timestamps → they complete correctly across offline periods; resolved on load and in tick.
- Persistence: `saveStore` adapter tries `window.storage` (Claude artifact API) then falls back to `localStorage` (deployed web). Save key `home-front-uk-save`. Autosave 10s + visibilitychange.
- Scene is inline SVG: factories appear with industry, Spitfires with air wings, fleet in the Channel; SMIL animation (animateMotion/animate).

## Backlog (rough priority)
1. **Country selection** — nation picker with real trade-offs: USA (weak start, monster late industry), USSR (manpower flood, poor factories), Germany (best mil output, oil/rubber starved → synthetic plants building), Japan (naval/air, steel-poor). Nations as data objects modifying base rates/costs/starting theatres.
2. **Prestige: Total Victory** — win all theatres to stage N → reset, earn Doctrine points → permanent doctrine TREE with land/sea/air branches (not a flat multiplier). Restarting as a different country is the replay hook.
3. **Oil deficit penalties** — running dry should slow active theatre timers (HOI4 fuel), not just stall shipyards.
4. More theatres (Eastern Front, Pacific, Normandy as late-game), equipment tiers (rifle → semi-auto), civilian factory construction-speed mechanic, sound, PWA manifest for home-screen install.

## Balance philosophy
First prestige should take 30–60 min; each subsequent run ~2× faster to the same point. Watch the mid-game around the tank/fighter line costs — that's where the interesting scarcity decisions live. All pacing knobs are constants in the data tables.
