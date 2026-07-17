// Duration (seconds) of a theatre operation at a given stage, after nation
// speed upgrades. Base duration scales ×1.3 per stage already won; each owned
// speed upgrade (e.g. radar) that covers one of the theatre's flags (air/naval)
// multiplies by its factor. Used by both the launch action and the progress bar.
export function theatreDuration(theatre, stage, nation, upgradesOwned) {
  let dur = theatre.dur * Math.pow(1.3, stage - 1);
  for (const u of nation.upgrades) {
    if (u.speeds && upgradesOwned[u.id] && u.speeds.some((flag) => theatre[flag])) {
      dur *= u.factor;
    }
  }
  return dur;
}
