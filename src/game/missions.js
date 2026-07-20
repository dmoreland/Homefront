import { FAIL_LOSS, mergeReadiness } from "./forces.js";

// Pure mission resolution — used on load (offline completion) and in the tick.
// Missions store absolute `endsAt` timestamps, so they resolve correctly across
// offline periods. Outcome is decided at launch (the failure roll is baked into
// `m.willFail`), so resolution stays deterministic and pure:
//   victory → theatre stage +1, War Score +stage, committed forces returned.
//   defeat  → no stage/score; only a fraction (1 − FAIL_LOSS) of forces come back.
// Returning units blend back into their pool at the readiness they deployed with
// (`m.forceReadiness`), so reinforcement done while they were away isn't lost or
// double-counted. Returns the advanced state plus the completed missions (each
// carries its own `willFail`, so the caller can message victory vs defeat).
export function resolveMissions(game, nowMs) {
  const done = (game.missions || []).filter((m) => m.endsAt <= nowMs);
  if (!done.length) return { game, completed: [] };

  const stages = { ...game.stages };
  const forces = { ...game.forces };
  const readiness = { ...game.readiness };
  let warScore = game.warScore;
  let warTotal = game.warTotal || 0; // cumulative earned this run — drives prestige payout
  // Blend `ret` returning units (at readiness rr) of force k back into the pool.
  const returnForce = (k, ret, rr) => {
    if (ret <= 0) return;
    const before = forces[k] || 0;
    readiness[k] = mergeReadiness(before, readiness[k] ?? 1, ret, rr);
    forces[k] = before + ret;
  };
  for (const m of done) {
    const rr = m.forceReadiness || {};
    if (m.willFail) {
      for (const k in m.forces) returnForce(k, Math.floor(m.forces[k] * (1 - FAIL_LOSS)), rr[k] ?? m.readiness ?? 1);
      continue;
    }
    stages[m.theatre] = (stages[m.theatre] || 0) + 1;
    warScore += m.stage;
    warTotal += m.stage;
    for (const k in m.forces) returnForce(k, m.forces[k], rr[k] ?? m.readiness ?? 1);
  }
  const missions = (game.missions || []).filter((m) => m.endsAt > nowMs);
  return { game: { ...game, stages, forces, readiness, warScore, warTotal, missions }, completed: done };
}
