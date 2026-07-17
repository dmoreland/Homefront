import { DOCTRINES, PRESTIGE_K, PRESTIGE_STAGE } from "../data/doctrines.js";

const RES_KEYS = ["steel", "alu", "oil", "rubber", "manpower"];
const UPKEEP_KEYS = ["air", "fleet"];

// Aggregate all purchased doctrine effects into a single `mods` bundle that the
// pure simulation and the actions read. Multipliers stack multiplicatively;
// additive effects sum. computeMods({}) returns the identity bundle.
export function computeMods(purchased = {}) {
  const mods = {
    genMult: { steel: 1, alu: 1, oil: 1, rubber: 1, manpower: 1 },
    forceCostMult: { inf: 1, arm: 1, air: 1, fleet: 1 },
    upkeepMult: { air: 1, fleet: 1 },
    stageReqDelta: 0,
    opSpeedMult: 1,
    offlineRateAdd: 0,
    startBonus: {},
    tapMult: 1,
  };
  for (const node of DOCTRINES) {
    if (!purchased[node.id]) continue;
    const e = node.effect;
    switch (e.kind) {
      case "genMult": {
        const keys = e.res === "all" ? RES_KEYS : [].concat(e.res);
        for (const r of keys) mods.genMult[r] *= e.mult;
        break;
      }
      case "forceCost":
        mods.forceCostMult[e.target] *= e.mult;
        break;
      case "upkeep": {
        const keys = e.target === "all" ? UPKEEP_KEYS : [].concat(e.target);
        for (const t of keys) mods.upkeepMult[t] *= e.mult;
        break;
      }
      case "stageReq":
        mods.stageReqDelta += e.delta;
        break;
      case "opSpeed":
        mods.opSpeedMult *= e.mult;
        break;
      case "offlineRate":
        mods.offlineRateAdd += e.add;
        break;
      case "startBonus":
        for (const r in e.res) mods.startBonus[r] = (mods.startBonus[r] || 0) + e.res[r];
        break;
      case "tapMult":
        mods.tapMult *= e.mult;
        break;
      default:
        break;
    }
  }
  return mods;
}

// Doctrine points awarded for a prestige, from the run's cumulative War Score.
// Square-root scaling so a huge run still pays out sensibly (F13).
export function doctrinePoints(warTotal) {
  return Math.floor(PRESTIGE_K * Math.sqrt(Math.max(0, warTotal || 0)));
}

// Total Victory: every theatre of the active nation reached PRESTIGE_STAGE wins.
export function totalVictory(game, nation) {
  return nation.theatres.every((t) => (game.stages[t.id] || 0) >= PRESTIGE_STAGE);
}

// Force recruit cost after Land/Sea/Air cost-reduction doctrines.
export function effectiveForceCost(force, mods) {
  const m = mods?.forceCostMult?.[force.id] ?? 1;
  if (m === 1) return force.cost;
  const c = {};
  for (const k in force.cost) c[k] = Math.ceil(force.cost[k] * m);
  return c;
}

// Theatre force requirement after the stage-requirement doctrine (floored at 1).
export function effectiveNeed(theatre, stage, mods) {
  const need = theatre.need(stage);
  const d = mods?.stageReqDelta ?? 0;
  if (!d) return need;
  const out = {};
  for (const k in need) out[k] = Math.max(1, need[k] + d);
  return out;
}
