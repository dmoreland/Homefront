// Enemy pressure — the opponent mechanic. Each front you've engaged (won at
// least one stage at) accrues pressure over time; when it maxes, an enemy
// offensive lands. You defend a front by GARRISONING idle forces there: a
// garrison slows pressure growth and, when an offensive hits, its strength
// (count × readiness, weighted by nation grit) versus the assault decides the
// outcome — repelled (light garrison losses), contained (losses + a resource
// raid), or overrun (heavy losses + a stage rolled back). Actively winning an
// operation at a front resets its pressure (see resolveMissions). All pure; the
// outcome is deterministic from the strength ratio (no RNG), so it's testable
// and offline-safe (stepPressure resolves at most one offensive per front/call).
import { trait } from "./forces.js";

export const PRESSURE_BASE = 0.004; // base pressure/sec on an engaged front
export const PRESSURE_STAGE_K = 0.4; // each won stage escalates the enemy
export const GARRISON_SLOW_K = 0.8; // garrison strength slows pressure growth
export const ASSAULT_BASE = 1.2; // assault strength per won stage
export const PRESSURE_RESET = 0.15; // pressure left after an offensive resolves
export const REPEL_LOSS = 0.1; // garrison casualties when the assault is repelled
export const CONTAIN_LOSS = 0.3; // ...when contained (front held, but mauled)
export const OVERRUN_LOSS = 0.6; // ...when overrun (front undefended)
export const RAID_RES_FRAC = 0.2; // resource stockpile stripped on an overrun

export const forceIds = ["inf", "arm", "air", "fleet"];
const lossFrac = { repelled: REPEL_LOSS, contained: CONTAIN_LOSS, overrun: OVERRUN_LOSS };

// Defensive strength of a front's garrison — count weighted by pool readiness
// (equipment quality) and the nation's grit (numbers hold better at high grit).
export function defenseStrength(garrison, readiness, nation) {
  const g = garrison || {};
  let d = 0;
  for (const fid of forceIds) d += (g[fid] || 0) * (readiness?.[fid] ?? 1);
  return d * (0.7 + 0.6 * trait(nation).grit);
}

// The enemy assault escalates with how many victories you've won at the front.
export function assaultStrength(stage) {
  return ASSAULT_BASE * Math.max(1, stage);
}

// Pressure accrual/sec: escalates with stage, slowed by a garrison.
export function pressureRate(stage, defense) {
  return (PRESSURE_BASE * (1 + PRESSURE_STAGE_K * stage)) / (1 + GARRISON_SLOW_K * defense);
}

// Deterministic outcome tier from the defence/assault ratio.
export function offensiveOutcome(defense, assault) {
  const r = assault > 0 ? defense / assault : 1;
  if (r >= 1) return "repelled";
  if (r >= 0.5) return "contained";
  return "overrun";
}

// Advance pressure on every engaged front, resolving at most one offensive per
// front this call (so a large offline dt can't cascade many). Pure — returns
// { game, events } with events = [{ theatre, outcome }] for the caller's toasts.
export function stepPressure(game, nation, dt) {
  const stages = game.stages || {};
  const engaged = nation.theatres.filter((t) => (stages[t.id] || 0) >= 1);
  if (!engaged.length) return { game, events: [] };

  const pressure = { ...game.pressure };
  let garrison = game.garrison || {};
  let res = game.res;
  let stagesOut = game.stages;
  let hit = false;
  const events = [];

  for (const t of engaged) {
    const stage = stages[t.id] || 0;
    const defense = defenseStrength(garrison[t.id], game.readiness, nation);
    const cur = (game.pressure?.[t.id] || 0) + pressureRate(stage, defense) * dt;
    if (cur < 1) { pressure[t.id] = cur; continue; }

    if (!hit) { garrison = { ...garrison }; res = { ...res }; stagesOut = { ...stagesOut }; hit = true; }
    const outcome = offensiveOutcome(defense, assaultStrength(stage));
    const gOut = { ...(garrison[t.id] || {}) };
    for (const fid of forceIds) if (gOut[fid]) gOut[fid] = Math.max(0, Math.floor(gOut[fid] * (1 - lossFrac[outcome])));
    garrison[t.id] = gOut;
    // Only an overrun (an essentially undefended front) loses ground and gets
    // raided; any garrison that reaches "contained" holds the line at a cost.
    if (outcome === "overrun") {
      for (const k in res) res[k] = res[k] * (1 - RAID_RES_FRAC);
      stagesOut[t.id] = Math.max(0, (stagesOut[t.id] || 0) - 1);
    }
    pressure[t.id] = PRESSURE_RESET;
    events.push({ theatre: t.id, outcome });
  }

  return { game: { ...game, pressure, garrison, res, stages: stagesOut }, events };
}
