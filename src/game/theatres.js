// Duration (seconds) of a theatre operation at a given stage, after nation
// speed upgrades and doctrine effects. Base duration scales ×1.3 per stage
// already won; each owned speed upgrade (e.g. radar) covering one of the
// theatre's flags (air/naval) multiplies by its factor, then the Air-doctrine
// opSpeed multiplier applies to air/naval ops too. `mods` is optional.
export function theatreDuration(theatre, stage, nation, upgradesOwned, mods) {
  let dur = theatre.dur * Math.pow(1.3, stage - 1);
  for (const u of nation.upgrades) {
    if (u.speeds && upgradesOwned[u.id] && u.speeds.some((flag) => theatre[flag])) {
      dur *= u.factor;
    }
  }
  const opMult = mods?.opSpeedMult ?? 1;
  if (opMult !== 1 && (theatre.air || theatre.naval)) dur *= opMult;
  return dur;
}

// F15 fuel mechanic: running dry slows active air/naval operations. Each starved
// tick, such a mission makes only (1 - FUEL_SLOW) of its progress.
export const FUEL_SLOW = 0.5;

// Oil is "starved" when the stockpile is empty and demand still exceeds supply.
export function isFuelStarved(res, net) {
  return (res.oil ?? 0) <= 1e-6 && (net.oil ?? 0) < 0;
}

// While fuel-starved, push the endsAt of active air/naval missions forward so
// they take longer (keeping endsAt an absolute timestamp keeps offline
// resolution simple — the penalty only applies during live ticks). Land
// operations are unaffected. Returns the same array reference when nothing changes.
export function applyFuelPenalty(missions, nation, starved, dt) {
  if (!starved || !missions.length) return missions;
  const theatreById = Object.fromEntries(nation.theatres.map((t) => [t.id, t]));
  let changed = false;
  const next = missions.map((m) => {
    const t = theatreById[m.theatre];
    if (t && (t.air || t.naval)) {
      changed = true;
      return { ...m, endsAt: m.endsAt + FUEL_SLOW * dt * 1000 };
    }
    return m;
  });
  return changed ? next : missions;
}
