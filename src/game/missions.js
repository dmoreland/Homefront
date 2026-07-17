// Pure mission resolution — used on load (offline completion) and in the tick.
// Missions store absolute `endsAt` timestamps, so they resolve correctly across
// offline periods. A completed mission grants a theatre stage, War Score equal to
// its stage, and returns its committed forces to the pool.
// Returns the advanced state plus the list of missions that completed.
export function resolveMissions(game, nowMs) {
  const done = (game.missions || []).filter((m) => m.endsAt <= nowMs);
  if (!done.length) return { game, completed: [] };

  const stages = { ...game.stages };
  const forces = { ...game.forces };
  let warScore = game.warScore;
  for (const m of done) {
    stages[m.theatre] = (stages[m.theatre] || 0) + 1;
    warScore += m.stage;
    for (const k in m.forces) forces[k] = (forces[k] || 0) + m.forces[k];
  }
  const missions = (game.missions || []).filter((m) => m.endsAt > nowMs);
  return { game: { ...game, stages, forces, warScore, missions }, completed: done };
}
