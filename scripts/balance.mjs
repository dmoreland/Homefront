// Headless balance simulator (PRD risk mitigation).
// Plays a simple greedy strategy over the PURE game logic and reports
// time-to-first-prestige plus milestones per nation. Not shipped in the build.
//
//   npm run balance            # all nations
//   npm run balance -- germany # one nation
//
// The policy is a heuristic "active player", not optimal play — it exists to
// spot gross imbalance (a nation that prestiges in 5 min or never) and to sanity
// -check tuning against the PRD's "first prestige in 30–60 min" target.

import { NATIONS, getNation, newGame } from "../src/data/nations.js";
import { LINES } from "../src/data/gameData.js";
import { simulate } from "../src/game/simulate.js";
import { resolveMissions } from "../src/game/missions.js";
import { costOf, canAfford } from "../src/game/economy.js";
import { applyFuelPenalty, isFuelStarved, theatreDuration } from "../src/game/theatres.js";
import { computeMods, doctrinePoints, effectiveForceCost, effectiveNeed, totalVictory } from "../src/game/doctrines.js";

const DT = 1; // 1-second steps
const MAX_SECONDS = 6 * 3600; // give up after 6h of sim time
const TAP_RATE = 3; // simulated foundry taps per second while bootstrapping
const PRESTIGE_STAGE = 3;

// Which equipment each force needs a line for (to prioritise line-building).
const forceEquip = (force) => Object.keys(force.cost).filter((k) => k !== "manpower");

function pay(g, cost) {
  const res = { ...g.res }, eq = { ...g.eq };
  for (const k in cost) (k in res ? res : eq)[k] -= cost[k];
  return { ...g, res, eq };
}

// Force ids still in deficit for some incomplete, non-active theatre.
function wantedForces(g, nation, mods) {
  const want = {};
  for (const th of nation.theatres) {
    const stage = (g.stages[th.id] || 0) + 1;
    if (stage > PRESTIGE_STAGE) continue;
    if (g.missions.some((m) => m.theatre === th.id)) continue;
    const need = effectiveNeed(th, stage, mods);
    for (const k in need) {
      const deficit = need[k] - (g.forces[k] || 0);
      if (deficit > 0) want[k] = Math.max(want[k] || 0, deficit);
    }
  }
  return want;
}

function greedy(g, nation, mods, t) {
  const forceById = Object.fromEntries(nation.forces.map((f) => [f.id, f]));
  for (let guard = 0; guard < 500; guard++) {
    let acted = false;

    // 1. Launch any theatre whose forces are ready.
    for (const th of nation.theatres) {
      const stage = (g.stages[th.id] || 0) + 1;
      if (stage > PRESTIGE_STAGE) continue;
      if (g.missions.some((m) => m.theatre === th.id)) continue;
      const need = effectiveNeed(th, stage, mods);
      if (Object.keys(need).every((k) => (g.forces[k] || 0) >= need[k])) {
        const forces = { ...g.forces };
        for (const k in need) forces[k] -= need[k];
        const dur = theatreDuration(th, stage, nation, g.upgrades, mods);
        g = { ...g, forces, missions: [...g.missions, { theatre: th.id, stage, forces: need, endsAt: (t + dur) * 1000 }] };
        acted = true;
      }
    }

    // 2. Recruit a needed force if we can afford it.
    const want = wantedForces(g, nation, mods);
    let recruited = false;
    for (const fid in want) {
      const f = forceById[fid];
      const cost = effectiveForceCost(f, mods);
      const stock = { ...g.eq, manpower: g.res.manpower };
      if (canAfford(stock, cost)) { g = { ...pay(g, cost), forces: { ...g.forces, [fid]: (g.forces[fid] || 0) + 1 } }; recruited = acted = true; break; }
    }
    if (recruited) continue;

    // 3. Buy affordable War Cabinet upgrades (industry = steel scaling; laws/radar via War Score).
    let boughtUpgrade = false;
    for (const u of nation.upgrades) {
      if (g.upgrades[u.id] || (u.req && !g.upgrades[u.req])) continue;
      if (u.ws) { if (g.warScore >= u.ws) { g = { ...g, warScore: g.warScore - u.ws, upgrades: { ...g.upgrades, [u.id]: true } }; boughtUpgrade = acted = true; break; } }
      else if (canAfford(g.res, u.cost)) { g = { ...pay(g, u.cost), upgrades: { ...g.upgrades, [u.id]: true } }; boughtUpgrade = acted = true; break; }
    }
    if (boughtUpgrade) continue;

    // 4. Grow: buy the cheapest affordable generator or production line. As a
    // building's cost climbs (×1.15) the cheapest naturally rotates, balancing
    // the economy. Skip lines whose equipment no theatre force needs.
    const neededEquip = new Set(nation.forces.flatMap(forceEquip));
    const options = [
      ...nation.generators,
      ...LINES.filter((l) => neededEquip.has(l.out)),
    ];
    let best = null;
    for (const item of options) {
      const cost = costOf(item.cost, g.owned[item.id] || 0);
      if (!canAfford(g.res, cost)) continue;
      const total = Object.values(cost).reduce((a, b) => a + b, 0);
      if (!best || total < best.total) best = { item, cost, total };
    }
    if (best) { g = { ...pay(g, best.cost), owned: { ...g.owned, [best.item.id]: (g.owned[best.item.id] || 0) + 1 } }; acted = true; }

    if (!acted) break;
  }
  return g;
}

export function runNation(nation) {
  let g = newGame(nation);
  const mods = computeMods({}); // first run — no doctrines
  const milestones = {};
  const mark = (k, t) => { if (milestones[k] == null) milestones[k] = t; };
  let taps = 0;

  for (let t = 0; t < MAX_SECONDS; t += DT) {
    // Bootstrap: simulate foundry tapping while the economy is tiny.
    if ((g.owned.mill || 0) < 4) {
      const per = (nation.tapBase || 2) * mods.tapMult;
      g = { ...g, res: { ...g.res, steel: g.res.steel + per * TAP_RATE * DT } };
      taps += TAP_RATE * DT;
    }
    const r = simulate(g, DT, nation, mods);
    g = { ...g, res: r.res, eq: r.eq };
    g = { ...g, missions: applyFuelPenalty(g.missions, nation, isFuelStarved(r.res, r.net), DT) };

    const rm = resolveMissions(g, t * 1000);
    g = rm.game;
    for (const m of rm.completed) mark(`${m.theatre} S${m.stage}`, t);

    g = greedy(g, nation, mods, t);

    if ((g.owned.mill || 0) >= 1) mark("first mill", t);
    if (Object.values(g.forces).some((n) => n > 0)) mark("first force", t);
    if (totalVictory(g, nation)) { mark("PRESTIGE", t); break; }
  }

  return { nation, milestones, warTotal: g.warTotal, points: doctrinePoints(g.warTotal), taps, stages: g.stages };
}

const fmtTime = (s) => (s == null ? "—" : `${Math.floor(s / 60)}m${String(Math.floor(s % 60)).padStart(2, "0")}s`);

function main() {
  const which = process.argv[2];
  const list = which ? [getNation(which)].filter(Boolean) : NATIONS;
  if (!list.length) { console.error(`Unknown nation: ${which}`); process.exit(1); }

  for (const nation of list) {
    const res = runNation(nation);
    console.log(`\n=== ${nation.name} ===`);
    const prestige = res.milestones.PRESTIGE;
    console.log(`Time to first prestige: ${fmtTime(prestige)}${prestige == null ? " (not reached in " + MAX_SECONDS / 3600 + "h)" : ""}`);
    console.log(`Doctrine points earned: ${res.points} (warTotal ${res.warTotal})`);
    console.log(`Simulated taps: ${res.taps}`);
    console.log("Milestones:");
    for (const [k, v] of Object.entries(res.milestones).sort((a, b) => a[1] - b[1])) {
      console.log(`  ${fmtTime(v).padStart(7)}  ${k}`);
    }
    console.log("Final theatre stages:", JSON.stringify(res.stages));
  }
}

// Run as a CLI only when invoked directly (not when imported by a test).
if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("/scripts/balance.mjs")) main();
