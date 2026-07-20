// Readiness (equipment quality) — the quality-vs-quantity layer.
// Forces can be raised fully-equipped (RECRUIT, readiness 1.0) or MOBILISED with
// whatever equipment is on hand — at ANY readiness, even 0%, as long as there's
// manpower. Under-strength units then reinforce over time: surplus equipment is
// poured into existing pools (see `reinforce`) before it can raise new units.
// Low readiness makes theatre operations slower (attrition) and, below a
// nation-dependent threshold, risks defeat. Nations differ by `grit` — tolerance
// to fighting under-equipped (quantity over quality). All functions here are pure;
// the failure roll itself lives in the engine.
import { effectiveForceCost } from "./doctrines.js";

export const ATTRITION_BASE = 1.6; // duration multiplier weight at readiness 0
export const READY_SAFE_BASE = 0.72; // readiness at/above which there's no defeat risk
export const MAX_FAIL = 0.6; // defeat chance at readiness 0
export const FAIL_LOSS = 0.5; // fraction of committed forces lost on defeat
const DEFAULT = { grit: 0.5 };

// Derived per-nation trait bundle.
export function trait(nation) {
  const grit = nation.grit ?? DEFAULT.grit;
  return {
    grit,
    attritionK: ATTRITION_BASE * (1 - 0.6 * grit), // higher grit → gentler time penalty
    readySafe: READY_SAFE_BASE - 0.35 * grit, // higher grit → tolerate lower readiness before risk
  };
}

// Equipment keys of a cost map (everything except manpower).
export const equipKeys = (cost) => Object.keys(cost).filter((k) => k !== "manpower");

// Readiness we'd mobilise at right now for a given (doctrine-adjusted) cost and
// equipment stock: the tightest equipment ratio, 0..1 (0 with nothing on hand).
// Mobilising is always allowed as long as manpower is available (checked by the
// caller) — under-equipped units just deploy low and reinforce later.
export function mobiliseReadiness(cost, stock) {
  const keys = equipKeys(cost);
  if (!keys.length) return 1;
  let r = 1;
  for (const k of keys) r = Math.min(r, (stock[k] || 0) / cost[k]);
  return Math.max(0, Math.min(1, r));
}

// The equipment+manpower a mobilise at readiness r consumes (full manpower,
// r-fraction of each equipment).
export function mobiliseCost(cost, r) {
  const out = {};
  for (const k in cost) out[k] = k === "manpower" ? cost[k] : cost[k] * r;
  return out;
}

// Weighted-average readiness of two groups merged into one pool.
export const mergeReadiness = (nA, rA, nB, rB) => (nA + nB > 0 ? (nA * rA + nB * rB) / (nA + nB) : 1);

// New pool average readiness after adding one unit at readiness r.
export const poolReadiness = (count, avg, r) => mergeReadiness(count, avg, 1, r);

// Pour available equipment into under-strength pools, lifting their readiness
// toward full BEFORE any of it is free to raise new units. Each pool holds
// equipment uniformly across its equipment types (invariant held_k =
// count·readiness·cost_k, preserved by recruit/mobilise), so lifting a pool from
// readiness r toward 1 costs count·Δ·cost_k of each key. Pools fill in force-config
// order, so shared equipment (e.g. artillery) reinforces earlier forces first.
// Pure: returns { eq, readiness }, reusing the inputs when nothing changed.
export function reinforce(forces, readiness, eq, nation, mods) {
  const stock = { ...eq };
  const out = { ...readiness };
  let touched = false;
  for (const f of nation.forces) {
    const n = forces[f.id] || 0;
    const r = out[f.id] ?? 1;
    if (n <= 0 || r >= 1) continue;
    const cost = effectiveForceCost(f, mods);
    const keys = equipKeys(cost);
    if (!keys.length) continue;
    let delta = 1 - r;
    for (const k of keys) {
      const per = n * cost[k]; // equipment to lift the whole pool by +1.0 readiness
      if (per > 0) delta = Math.min(delta, (stock[k] || 0) / per);
    }
    if (delta <= 1e-9) continue;
    for (const k of keys) stock[k] = (stock[k] || 0) - n * delta * cost[k];
    out[f.id] = r + delta;
    touched = true;
  }
  return touched ? { eq: stock, readiness: out } : { eq, readiness };
}

// Average readiness of the forces committed to an operation (weighted by count).
export function committedReadiness(need, readiness) {
  let tot = 0, w = 0;
  for (const k in need) { tot += (readiness[k] ?? 1) * need[k]; w += need[k]; }
  return w ? tot / w : 1;
}

// Duration multiplier from attrition — 1 at full readiness, larger as it drops.
export function attritionMult(readiness, nation) {
  const r = Math.max(0, Math.min(1, readiness ?? 1));
  return 1 + trait(nation).attritionK * (1 - r);
}

// Probability (0..1) an operation at this readiness ends in defeat.
export function failureChance(readiness, nation) {
  const r = Math.max(0, Math.min(1, readiness ?? 1));
  const { readySafe } = trait(nation);
  if (r >= readySafe) return 0;
  return Math.min(MAX_FAIL, ((readySafe - r) / readySafe) * MAX_FAIL);
}
