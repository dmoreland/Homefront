# Home Front — WW2 industrial idle game

A grand-strategy-inspired WW2 idle/clicker. A React (Vite) app with a nation picker — currently United Kingdom and Germany. Prototyped in Claude.ai as a single file, since split into pure game logic, a `useGameEngine` hook, and presentational components.

## How to run
```
npm install
npm run dev     # local dev server
npm test        # vitest unit + render tests
npm run build   # production build
```
Deploy: GitHub Pages via `.github/workflows/deploy.yml` (static Vite build, no backend); live at https://dmoreland.github.io/Homefront/.

## Project layout
- `src/data/gameData.js` — shared tables (RES, LINES, FRESH). Universal across nations.
- `src/data/nations.js` — the `NATIONS` config array (UK, Germany) + `getNation`/`newGame`. Each nation is a data object: starting resources, passive trickle, generators (incl. unique buildings like the Synthetic Refinery), forces, theatres, and upgrades. **Adding a nation is a config change here.**
- `src/game/` — pure, unit-tested logic: `simulate.js` (the nation-parameterised game step), `economy.js` (cost scaling/affordability), `missions.js` (theatre resolution), `offline.js` (offline earnings), `theatres.js` (`theatreDuration`), `saveStore.js` (persistence adapter). Co-located `*.test.js` files.
- `src/hooks/useGameEngine.js` — owns state and the impure lifecycle (tick, autosave, load/offline, actions, nation selection). The one place timers/storage/toasts live.
- `src/components/` — presentational pieces: `NationPicker` (start screen), `GameView` (active campaign composition), and the panels (Scene, ResourceBar, GeneratorList, ProductionLines, ForcesList, Theatres, WarCabinet, Foundry, Header, Footer, Toast).
- `src/ui/` — shared `format.js` (fmt, costStr) and `styles.js`.
- `src/App.jsx` — picks NationPicker vs GameView, mounts the toast.

## Nation config model
`simulate(state, dt, nation)` and the actions read everything from the active nation object, so nations are pure data. Key shapes (see `nations.js` header comment): generators use `produces` (scaled by civ & theatre multipliers), `globalMult` (Civilian Factory), or `converts` (Synthetic Refinery: throttles like a production line, trading steel for oil/rubber). Theatre rewards are `{ kind: "mult", res, per }` or `{ kind: "flat", per }` applied per victory. Laws carry `manpowerMult`, speed upgrades `speeds`+`factor`, the foundry upgrade `tapMult`. Force slots (inf/arm/air/fleet) and equipment keys are stable across nations; only names/costs differ. Germany's identity: strong steel, no colonial trickle, oil/rubber only via Synthetic Refineries or seized in theatres; forces are the three service branches (Wehrmacht/Panzer, Luftwaffe, Kriegsmarine) — no SS/political units.

## Core design
Two-stage production chain (the grand-strategy hook — resources do NOT buy units directly):
1. **Raw resources** (steel, aluminium, oil, rubber, manpower) from generators; UK gets a passive Empire trickle of +0.2 oil & rubber/sec.
2. **Production lines** CONSUME resources per second to make equipment (rifles, artillery, tanks, fighters, warships). Lines throttle proportionally when starved and show STALLED %.
3. **Forces** recruited from equipment + manpower: infantry/armoured divisions, air wings, fleets. Air & fleets have oil upkeep.
4. **Theatres** (e.g. Battle of Britain / Atlantic / North Africa): commit forces to timed operations. Victory returns forces, grants stacking oil/rubber/aluminium bonuses + War Score. Stage requirements scale ×2 per victory, duration ×1.3. **No theatre boosts steel** — steel scaling is industry-driven (below), so no single theatre is a must-rush.
5. **War Cabinet** upgrades: resource-bought **Industry** tiers (steel output ×, the main in-run steel scaling lever, decoupled from theatres), plus War-Score-bought conscription laws (manpower ×2/×4/×8) and Radar (air/naval ops 25% faster). The Civilian Factory (generator) is the repeatable +10%-all multiplier.
6. **Prestige & doctrines** (cross-run, shared across nations): reach Total Victory (every theatre at Stage 3+) to prestige — bank Doctrine Points (`floor(1.5·√warTotal)`), wipe the campaign, return to the picker. Points buy permanent nodes in the Doctrine HQ across four branches — **War Economy** (resource output, starting stockpile, offline rate), Land, Sea, Air. Config in `src/data/doctrines.js`; effects aggregate into a `mods` bundle (`src/game/doctrines.js`).

## Architecture notes
- `simulate(state, dt, nation, mods?)` (in `src/game/simulate.js`) is the PURE game step — used by the 250ms tick AND offline earnings (50% rate + doctrine bonus, 8h cap). Keep it pure; nation balance lives in `src/data/nations.js`, doctrine balance in `src/data/doctrines.js`. `mods` (from `computeMods`) is optional — omitting it means no doctrine effects. Mission and offline resolution are likewise pure (`game/missions.js`, `game/offline.js`) and unit-tested.
- Doctrines: `game/doctrines.js` has `computeMods` (purchased → `mods`), `doctrinePoints`, `totalVictory`, `effectiveForceCost`, `effectiveNeed`. `mods` carries genMult/forceCostMult/upkeepMult/stageReqDelta/opSpeedMult/offlineRateAdd/startBonus/tapMult and is threaded into simulate, `theatreDuration`, and the recruit/launch/tap actions. `game.warTotal` is the cumulative War Score that drives the prestige payout (separate from spendable `warScore`).
- Resource bar shows NET flow (gen − line consumption − upkeep); deficit cards go red with ▼. Consumption is measured at current throttle, so a fully stalled line under-reports its theoretical demand.
- Missions store absolute `endsAt` timestamps → they complete correctly across offline periods; resolved on load and in tick. **F15 fuel mechanic**: when oil runs dry (`isFuelStarved`: stock 0 and net < 0), each live tick pushes active air/naval missions' `endsAt` forward by 50% of the tick (`applyFuelPenalty` in `game/theatres.js`), so they run at half speed until fuel recovers. Land ops are unaffected, and the penalty only applies to live ticks (offline resolution stays absolute-timestamp simple). The UI shows a ⛽ warning on slowed ops.
- Persistence: `saveStore` adapter tries `window.storage` (Claude artifact API) then falls back to `localStorage` (deployed web). Two independent stores: the campaign save (`home-front-save`, carries `nationId`, cleared on reset/prestige) and the cross-run doctrine save (`home-front-doctrines`, survives resets). Autosave 10s + visibilitychange.
- Scene is inline SVG: factories appear with industry, Spitfires with air wings, fleet in the Channel; SMIL animation (animateMotion/animate).

## Backlog (rough priority)
1. **Country selection** — nation picker with real trade-offs. **Done: UK + Germany** (Germany = strong industry, synthetic fuel). Remaining nations as config additions in `nations.js`: USA (weak start, monster late industry), USSR (manpower flood, poor factories), Japan (naval/air, steel-poor).
2. **Prestige: Total Victory** — **Done**: prestige at all-theatres-Stage-3 → Doctrine Points → four-branch permanent tree (War Economy / Land / Sea / Air), shared across nations. Follow-ups: more nodes/branches, a doctrine that tunes prestige payout, per-nation flavour nodes.
3. **Oil deficit penalties** — **Done (F15)**: running dry (0 oil, negative net) slows active air/naval ops 50% via `applyFuelPenalty`; land ops unaffected. Bites oil-starved play (esp. Germany), avoided by a well-run economy.
4. More theatres (Eastern Front, Pacific, Normandy as late-game), equipment tiers (rifle → semi-auto), civilian factory construction-speed mechanic, sound, PWA manifest for home-screen install.

## Balance philosophy
First prestige should take 30–60 min; each subsequent run ~2× faster to the same point. Watch the mid-game around the tank/fighter line costs — that's where the interesting scarcity decisions live. All pacing knobs are constants in the data tables.
