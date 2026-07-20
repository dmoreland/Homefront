// National Focus — a per-nation, per-run tree of focuses that complete on a
// TIMER and grant bonuses to production, theatres, and forces (HOI4-style).
// One focus is active at a time; completed ids persist for the run (reset on
// prestige/reset). Completion is offline-safe: the active focus stores an
// absolute `endsAt`, resolved on the tick and on load (mirrors resolveMissions).
//
// Focus effects reuse the doctrine `mods` vocabulary where possible and add a
// few dims. `computeFocusMods` aggregates completed focuses into a mods-shaped
// bundle, which `mergeMods` folds on top of the doctrine bundle. Data shapes
// (see nations.js `focuses`):
//   genMult { res, mult } · forceCost { target, mult } · upkeep { target, mult }
//   stageReq { delta } · opSpeed { mult } · tapMult { mult }
//   manpowerMult { mult } · theatreReward { mult } · flatGen { res: {...} }
//   grant { res: {...} }   // one-time resource injection applied on completion
// All functions here are pure.

const RES_KEYS = ["steel", "alu", "oil", "rubber", "manpower"];
const UPKEEP_KEYS = ["air", "fleet"];

// Identity mods bundle — same shape doctrines produce (game/doctrines.js), so the
// two merge cleanly. Kept in sync with computeMods there.
export function identityMods() {
  return {
    genMult: { steel: 1, alu: 1, oil: 1, rubber: 1, manpower: 1 },
    forceCostMult: { inf: 1, arm: 1, air: 1, fleet: 1 },
    upkeepMult: { air: 1, fleet: 1 },
    stageReqDelta: 0,
    opSpeedMult: 1,
    offlineRateAdd: 0,
    startBonus: {},
    tapMult: 1,
    manpowerMult: 1,
    theatreRewardMult: 1,
    flatGen: {},
  };
}

// Aggregate the completed focuses of a nation into a mods bundle. `grant` is a
// completion-time effect (handled in resolveFocus), not a mod, so it's ignored here.
export function computeFocusMods(nation, done = {}) {
  const mods = identityMods();
  if (!nation) return mods;
  for (const f of nation.focuses || []) {
    if (!done[f.id]) continue;
    const e = f.effect;
    if (!e) continue;
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
      case "tapMult":
        mods.tapMult *= e.mult;
        break;
      case "manpowerMult":
        mods.manpowerMult *= e.mult;
        break;
      case "theatreReward":
        mods.theatreRewardMult *= e.mult;
        break;
      case "flatGen":
        for (const r in e.res) mods.flatGen[r] = (mods.flatGen[r] || 0) + e.res[r];
        break;
      default:
        break; // `grant` and unknown kinds: no mod contribution
    }
  }
  return mods;
}

// Combine two mods bundles: multiply the multiplicative dims, add the additive
// ones, sum the flat maps. Used to fold focus mods on top of doctrine mods.
export function mergeMods(a, b) {
  const out = identityMods();
  for (const r of RES_KEYS) out.genMult[r] = (a.genMult?.[r] ?? 1) * (b.genMult?.[r] ?? 1);
  for (const t of ["inf", "arm", "air", "fleet"]) out.forceCostMult[t] = (a.forceCostMult?.[t] ?? 1) * (b.forceCostMult?.[t] ?? 1);
  for (const t of UPKEEP_KEYS) out.upkeepMult[t] = (a.upkeepMult?.[t] ?? 1) * (b.upkeepMult?.[t] ?? 1);
  out.stageReqDelta = (a.stageReqDelta ?? 0) + (b.stageReqDelta ?? 0);
  out.opSpeedMult = (a.opSpeedMult ?? 1) * (b.opSpeedMult ?? 1);
  out.offlineRateAdd = (a.offlineRateAdd ?? 0) + (b.offlineRateAdd ?? 0);
  out.tapMult = (a.tapMult ?? 1) * (b.tapMult ?? 1);
  out.manpowerMult = (a.manpowerMult ?? 1) * (b.manpowerMult ?? 1);
  out.theatreRewardMult = (a.theatreRewardMult ?? 1) * (b.theatreRewardMult ?? 1);
  for (const src of [a.startBonus, b.startBonus]) for (const r in src || {}) out.startBonus[r] = (out.startBonus[r] || 0) + src[r];
  for (const src of [a.flatGen, b.flatGen]) for (const r in src || {}) out.flatGen[r] = (out.flatGen[r] || 0) + src[r];
  return out;
}

// A focus can be started when it isn't done, none is active, and its
// prerequisites (a single id or an array) are all complete.
export function focusAvailable(focus, state = {}) {
  const done = state.done || {};
  const active = state.active;
  if (done[focus.id]) return false;
  if (active) return false;
  if (!focus.req) return true;
  return [].concat(focus.req).every((r) => done[r]);
}

// Advance the active focus: if its timer has elapsed, mark it done, apply any
// one-time `grant` to resources, and clear the active slot. Pure and
// offline-safe (endsAt is absolute; resolved on the tick and on load). Returns
// { game, completed } where completed is the focus object (or null when nothing
// finished). Same game ref when nothing completed.
export function resolveFocus(game, nation, nowMs) {
  const focus = game.focus || { active: null, done: {} };
  const active = focus.active;
  if (!active || active.endsAt > nowMs) return { game, completed: null };

  const completed = (nation.focuses || []).find((f) => f.id === active.id) || { id: active.id };
  const done = { ...focus.done, [active.id]: true };
  let res = game.res;
  if (completed.effect?.kind === "grant") {
    res = { ...game.res };
    for (const r in completed.effect.res) res[r] = (res[r] || 0) + completed.effect.res[r];
  }
  return { game: { ...game, res, focus: { active: null, done } }, completed };
}
