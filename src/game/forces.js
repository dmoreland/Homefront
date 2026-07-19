// Readiness (equipment quality) — the quality-vs-quantity layer.
// Forces can be raised fully-equipped (readiness 1.0) or MOBILISED with whatever
// equipment is on hand (readiness = equipment fraction, down to the nation's
// floor). Low readiness makes theatre operations slower (attrition) and, below a
// nation-dependent threshold, risks defeat. Nations differ by two traits:
//   equipFloor — how far under-equipped they can mobilise
//   grit       — tolerance to being under-equipped (quantity vs quality)
// All functions here are pure; the failure roll itself lives in the engine.

export const ATTRITION_BASE = 1.6; // duration multiplier weight at readiness 0
export const READY_SAFE_BASE = 0.72; // readiness at/above which there's no defeat risk
export const MAX_FAIL = 0.6; // defeat chance at readiness 0
export const FAIL_LOSS = 0.5; // fraction of committed forces lost on defeat
const DEFAULT = { equipFloor: 0.5, grit: 0.5 };

// Derived per-nation trait bundle.
export function trait(nation) {
  const equipFloor = nation.equipFloor ?? DEFAULT.equipFloor;
  const grit = nation.grit ?? DEFAULT.grit;
  return {
    equipFloor,
    grit,
    attritionK: ATTRITION_BASE * (1 - 0.6 * grit), // higher grit → gentler time penalty
    readySafe: READY_SAFE_BASE - 0.35 * grit, // higher grit → tolerate lower readiness before risk
  };
}

// Equipment keys of a cost map (everything except manpower).
export const equipKeys = (cost) => Object.keys(cost).filter((k) => k !== "manpower");

// Readiness a nation could mobilise at right now for a given (doctrine-adjusted)
// cost and equipment stock — or null if it can't even reach the equipment floor.
export function mobiliseReadiness(cost, stock, nation) {
  const keys = equipKeys(cost);
  if (!keys.length) return 1;
  let r = 1;
  for (const k of keys) r = Math.min(r, (stock[k] || 0) / cost[k]);
  r = Math.min(1, r);
  return r >= trait(nation).equipFloor ? r : null;
}

// The equipment+manpower a mobilise at readiness r consumes (full manpower,
// r-fraction of each equipment).
export function mobiliseCost(cost, r) {
  const out = {};
  for (const k in cost) out[k] = k === "manpower" ? cost[k] : cost[k] * r;
  return out;
}

// New pool average readiness after adding one unit at readiness r.
export const poolReadiness = (count, avg, r) => (count > 0 ? (count * avg + r) / (count + 1) : r);

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
