import { simulate } from "./simulate.js";

export const OFFLINE_RATE = 0.5; // 50% production while away
export const OFFLINE_CAP_HOURS = 8;
const MIN_OFFLINE_SECONDS = 30; // ignore brief gaps

// Pure offline-earnings step. Given a (mission-resolved) game state, the active
// nation, and the timestamp it was last saved, advances resources/equipment at
// OFFLINE_RATE, capped at OFFLINE_CAP_HOURS. Returns { game, elapsed, sim } when
// earnings applied, or { game } unchanged when there's nothing meaningful to award.
export function applyOffline(game, savedAt, nowMs, nation) {
  if (!savedAt) return { game };
  const elapsed = Math.min((nowMs - savedAt) / 1000, OFFLINE_CAP_HOURS * 3600);
  if (elapsed <= MIN_OFFLINE_SECONDS) return { game };
  const sim = simulate(game, elapsed * OFFLINE_RATE, nation);
  return { game: { ...game, res: sim.res, eq: sim.eq }, elapsed, sim };
}
