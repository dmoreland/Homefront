# Home Front — WW2 industrial idle game

A Hearts of Iron 4-inspired idle/clicker. Currently v1: United Kingdom only, single-file React app in `src/App.jsx`, prototyped in Claude.ai and migrated here for proper development.

## How to run
```
npm install
npm run dev
```
Deploy target: Vercel or Netlify free tier (static Vite build, no backend).

## Core design
Two-stage production chain (the HOI4 hook — resources do NOT buy units directly):
1. **Raw resources** (steel, aluminium, oil, rubber, manpower) from generators; UK gets a passive Empire trickle of +0.2 oil & rubber/sec.
2. **Production lines** CONSUME resources per second to make equipment (rifles, artillery, tanks, fighters, warships). Lines throttle proportionally when starved and show STALLED %.
3. **Forces** recruited from equipment + manpower: infantry/armoured divisions, air wings, fleets. Air & fleets have oil upkeep.
4. **Theatres** (Battle of Britain / Atlantic / North Africa): commit forces to timed operations. Victory returns forces, grants stacking resource bonuses + War Score. Stage requirements scale ×2 per victory, duration ×1.3.
5. **War Score** is spent in the War Cabinet: conscription laws (manpower ×2/×4/×8), Radar (air/naval ops 25% faster).

## Architecture notes
- `simulate(state, dt)` is the PURE game step — used by the 250ms tick AND offline earnings (50% rate, 8h cap). Keep it pure; all balance lives in the data tables at the top (GENERATORS, LINES, FORCES, THEATRES, UPGRADES).
- Resource bar shows NET flow (gen − line consumption − upkeep); deficit cards go red with ▼. Consumption is measured at current throttle, so a fully stalled line under-reports its theoretical demand.
- Missions store absolute `endsAt` timestamps → they complete correctly across offline periods; resolved on load and in tick.
- Persistence: `saveStore` adapter tries `window.storage` (Claude artifact API) then falls back to `localStorage` (deployed web). Save key `home-front-uk-save`. Autosave 10s + visibilitychange.
- Scene is inline SVG: factories appear with industry, Spitfires with air wings, fleet in the Channel; SMIL animation (animateMotion/animate).

## Backlog (rough priority)
1. **Country selection** — nation picker with real trade-offs: USA (weak start, monster late industry), USSR (manpower flood, poor factories), Germany (best mil output, oil/rubber starved → synthetic plants building), Japan (naval/air, steel-poor). Nations as data objects modifying base rates/costs/starting theatres.
2. **Prestige: Total Victory** — win all theatres to stage N → reset, earn Doctrine points → permanent doctrine TREE with land/sea/air branches (not a flat multiplier). Restarting as a different country is the replay hook.
3. **Oil deficit penalties** — running dry should slow active theatre timers (HOI4 fuel), not just stall shipyards.
4. **Component split** — App.jsx is a deliberate single file from prototyping; split into components/ + a useGameEngine hook, keep simulate() pure and unit-testable.
5. More theatres (Eastern Front, Pacific, Normandy as late-game), equipment tiers (rifle → semi-auto), civilian factory construction-speed mechanic, sound, PWA manifest for home-screen install.

## Balance philosophy
First prestige should take 30–60 min; each subsequent run ~2× faster to the same point. Watch the mid-game around the tank/fighter line costs — that's where the interesting scarcity decisions live. All pacing knobs are constants in the data tables.
