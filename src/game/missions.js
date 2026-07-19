import { FAIL_LOSS } from "./forces.js";

// Pure mission resolution — used on load (offline completion) and in the tick.
// Missions store absolute `endsAt` timestamps, so they resolve correctly across
// offline periods. Outcome is decided at launch (the failure roll is baked into
// `m.willFail`), so resolution stays deterministic and pure:
//   victory → theatre stage +1, War Score +stage, committed forces returned.
//   defeat  → no stage/score; only a fraction (1 − FAIL_LOSS) of forces come back.
// Returns the advanced state plus the completed missions (each carries its own
// `willFail`, so the caller can message victory vs defeat).
export function resolveMissions(game, nowMs) {
  const done = (game.missions || []).filter((m) => m.endsAt <= nowMs);
  if (!done.length) return { game, completed: [] };

  const stages = { ...game.stages };
  const forces = { ...game.forces };
  let warScore = game.warScore;
  let warTotal = game.warTotal || 0; // cumulative earned this run — drives prestige payout
  for (const m of done) {
    if (m.willFail) {
      for (const k in m.forces) forces[k] = (forces[k] || 0) + Math.floor(m.forces[k] * (1 - FAIL_LOSS));
      continue;
    }
    stages[m.theatre] = (stages[m.theatre] || 0) + 1;
    warScore += m.stage;
    warTotal += m.stage;
    for (const k in m.forces) forces[k] = (forces[k] || 0) + m.forces[k];
  }
  const missions = (game.missions || []).filter((m) => m.endsAt > nowMs);
  return { game: { ...game, stages, forces, warScore, warTotal, missions }, completed: done };
}
