import { simulate } from "./simulate.js";

export const OFFLINE_RATE = 0.5; // 50% production while away (before doctrines)
export const OFFLINE_CAP_HOURS = 8;
const MIN_OFFLINE_SECONDS = 30; // ignore brief gaps

// Pure offline-earnings step. Advances resources/equipment at the effective
// offline rate (base + any Automated Foundries doctrine, capped just under 1),
// bounded by OFFLINE_CAP_HOURS. opts: { mods, rate }. Returns { game, elapsed,
// sim } when earnings applied, or { game } unchanged when there's nothing to award.
export function applyOffline(game, savedAt, nowMs, nation, opts = {}) {
  if (!savedAt) return { game };
  const elapsed = Math.min((nowMs - savedAt) / 1000, OFFLINE_CAP_HOURS * 3600);
  if (elapsed <= MIN_OFFLINE_SECONDS) return { game };
  const rate = Math.min(0.95, opts.rate ?? (OFFLINE_RATE + (opts.mods?.offlineRateAdd ?? 0)));
  const sim = simulate(game, elapsed * rate, nation, opts.mods);
  return { game: { ...game, res: sim.res, eq: sim.eq, readiness: sim.readiness }, elapsed, rate, sim };
}
