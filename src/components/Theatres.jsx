import { theatreDuration } from "../game/theatres.js";
import { effectiveNeed } from "../game/doctrines.js";
import { attritionMult, committedReadiness, failureChance } from "../game/forces.js";
import { assaultStrength, defenseStrength, offensiveOutcome, forceIds } from "../game/pressure.js";
import { GIcon, THEATRE_ICON, FORCE_ICON } from "../ui/Icon.jsx";
import { S } from "../ui/styles.js";

// Timed operations for the active nation: commit forces, watch the progress bar,
// collect the victory. `now` drives countdowns; the engine resolves completion on
// the tick. Once a front is engaged (≥1 victory) the enemy pushes back: a
// pressure bar climbs toward an offensive, and you garrison idle forces to defend
// it — the garrison's strength vs the assault decides repel / contain / overrun.
export function Theatres({ nation, stages, missions, forces, readiness, garrison, pressure, upgrades, mods, fuelStarved, now, onLaunch, onGarrison, onWithdraw }) {
  const forceName = (id) => nation.forces.find((f) => f.id === id)?.name || id;
  const owned = nation.forces.filter((f) => (forces[f.id] || 0) > 0 || Object.values(garrison).some((g) => g?.[f.id]));
  return (
    <>
      <h2 style={S.h2}>Theatres of War</h2>
      {nation.theatres.map((t) => {
        const won = stages[t.id] || 0;
        const stage = won + 1;
        const need = effectiveNeed(t, stage, mods);
        const active = missions.find((m) => m.theatre === t.id);
        const ready = !active && Object.keys(need).every((k) => (forces[k] || 0) >= need[k]);
        const needStr = Object.entries(need).map(([k, v]) => `${v}× ${forceName(k)}`).join(" + ");
        const projReady = ready ? committedReadiness(need, readiness) : 1;
        const projRisk = ready ? failureChance(projReady, nation) : 0;
        let pct = 0;
        if (active) {
          const total = theatreDuration(t, active.stage, nation, upgrades, mods) * attritionMult(active.readiness ?? 1, nation) * 1000;
          pct = Math.min(100, Math.max(0, (1 - (active.endsAt - now) / total) * 100));
        }

        // Enemy pressure & garrison — only on engaged fronts (≥1 victory won).
        const gr = garrison[t.id] || {};
        const grCount = forceIds.reduce((s, fid) => s + (gr[fid] || 0), 0);
        const engaged = won >= 1;
        const press = pressure[t.id] || 0;
        const defense = defenseStrength(gr, readiness, nation);
        const assault = assaultStrength(won);
        const outcome = offensiveOutcome(defense, assault); // what an offensive would do right now
        const holdColor = outcome === "repelled" ? "#6FBF73" : outcome === "contained" ? "#D9B14B" : "#E06A5A";
        const holdLabel = outcome === "repelled" ? "Will hold" : outcome === "contained" ? "Held at a cost" : "Will be overrun";

        return (
          <div key={t.id} style={{ ...S.panel, borderColor: active ? "#D9B14B" : press > 0.66 ? "#7A2E2E" : "#33506E" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ display: "flex", alignItems: "center", gap: 9 }}><GIcon name={THEATRE_ICON[t.icon] || "battle"} size={20} color="#D9B14B" /> {t.name}</strong>
              <span style={{ fontSize: 11, color: "#D9B14B" }}>{won} victories</span>
            </div>
            <div style={{ fontSize: 12, color: "#7E96AC", margin: "4px 0" }}>{t.rewardText}</div>

            {active ? (
              <div>
                <div style={{ background: "#16222E", borderRadius: 6, height: 8, overflow: "hidden", margin: "6px 0 4px" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#D9B14B" }} />
                </div>
                <div style={{ fontSize: 11, color: "#D9B14B" }}>⚔️ Engaged — {Math.max(0, Math.ceil((active.endsAt - now) / 1000))}s remaining</div>
                {(active.readiness ?? 1) < 0.999 && (
                  <div style={{ fontSize: 11, color: active.willFail ? "#E06A5A" : "#C9A06E", fontWeight: 700, marginTop: 2 }}>
                    {active.willFail
                      ? `☠️ Under-equipped (${Math.round((active.readiness ?? 1) * 100)}% readiness) — the line is buckling`
                      : `🎖️ Holding under-equipped at ${Math.round((active.readiness ?? 1) * 100)}% readiness`}
                  </div>
                )}
                {fuelStarved && (t.air || t.naval) && (
                  <div style={{ fontSize: 11, color: "#E08A7A", fontWeight: 700, marginTop: 2 }}>⛽ Fuel shortage — operation slowed 50%</div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => onLaunch(t)} disabled={!ready}
                  style={{ width: "100%", padding: "9px 0", fontSize: 13, fontWeight: 700, background: ready ? "linear-gradient(180deg,#D9B14B,#B8912F)" : "#1E2F42", color: ready ? "#16222E" : "#5E7183", border: "none", borderRadius: 8, cursor: ready ? "pointer" : "default", marginTop: 4 }}>
                  {ready ? `LAUNCH OPERATION (Stage ${stage})` : `Requires ${needStr}`}
                </button>
                {ready && projReady < 0.999 && (
                  <div style={{ fontSize: 11, color: projRisk > 0 ? "#E06A5A" : "#C9A06E", fontWeight: 700, marginTop: 4, textAlign: "center" }}>
                    {Math.round(projReady * 100)}% readiness{projRisk > 0 ? ` · ${Math.round(projRisk * 100)}% risk of defeat` : " · slower, but no defeat risk"}
                  </div>
                )}
              </>
            )}

            {/* Enemy pressure + garrison (engaged fronts only) */}
            {engaged && (
              <div style={{ marginTop: 8, borderTop: "1px solid #2A3B4E", paddingTop: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: press > 0.66 ? "#E06A5A" : "#9FB4C7", marginBottom: 3 }}>
                  <span>{press > 0.85 ? "⚠️ Enemy offensive imminent" : "Enemy pressure"}</span>
                  <span style={{ color: holdColor, fontWeight: 700 }}>{grCount > 0 ? holdLabel : "Undefended"}</span>
                </div>
                <div style={{ background: "#16222E", borderRadius: 6, height: 6, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ width: `${Math.min(100, press * 100)}%`, height: "100%", background: press > 0.66 ? "#C2453A" : "#8A5A3A" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#7E96AC" }}>Garrison:</span>
                  {owned.map((f) => {
                    const inG = gr[f.id] || 0;
                    const canAdd = (forces[f.id] || 0) > 0;
                    return (
                      <span key={f.id} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#1B2A3B", borderRadius: 6, padding: "2px 4px" }}>
                        <GIcon name={FORCE_ICON[f.id]} size={13} color="#C7D2DC" />
                        <button onClick={() => onWithdraw(t.id, f.id)} disabled={inG < 1} title={`Withdraw ${forceName(f.id)}`}
                          style={{ border: "none", background: "none", color: inG > 0 ? "#E0A050" : "#3E5169", fontWeight: 800, cursor: inG > 0 ? "pointer" : "default", padding: "0 3px", fontSize: 13 }}>−</button>
                        <span style={{ fontSize: 12, color: inG > 0 ? "#EDE6D3" : "#5E7183", minWidth: 8, textAlign: "center" }}>{inG}</span>
                        <button onClick={() => onGarrison(t.id, f.id)} disabled={!canAdd} title={`Station ${forceName(f.id)}`}
                          style={{ border: "none", background: "none", color: canAdd ? "#6FBF73" : "#3E5169", fontWeight: 800, cursor: canAdd ? "pointer" : "default", padding: "0 3px", fontSize: 13 }}>+</button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
