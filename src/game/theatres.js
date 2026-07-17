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
