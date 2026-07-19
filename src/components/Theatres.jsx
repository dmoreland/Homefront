import { theatreDuration } from "../game/theatres.js";
import { effectiveNeed } from "../game/doctrines.js";
import { attritionMult, committedReadiness, failureChance } from "../game/forces.js";
import { GIcon, THEATRE_ICON } from "../ui/Icon.jsx";
import { S } from "../ui/styles.js";

// Timed operations for the active nation: commit forces, watch the progress
// bar, collect the victory. `now` drives the countdown; the engine resolves
// completion on the tick. Requirements/durations reflect doctrine mods, and the
// readiness of the committed forces (attrition slows ops; low readiness risks defeat).
export function Theatres({ nation, stages, missions, forces, readiness, upgrades, mods, fuelStarved, now, onLaunch }) {
  const forceName = (id) => nation.forces.find((f) => f.id === id)?.name || id;
  return (
    <>
      <h2 style={S.h2}>Theatres of War</h2>
      {nation.theatres.map((t) => {
        const stage = (stages[t.id] || 0) + 1;
        const need = effectiveNeed(t, stage, mods);
        const active = missions.find((m) => m.theatre === t.id);
        const ready = !active && Object.keys(need).every((k) => (forces[k] || 0) >= need[k]);
        const needStr = Object.entries(need).map(([k, v]) => `${v}× ${forceName(k)}`).join(" + ");
        // Pre-launch: readiness of the forces we'd commit, and the resulting defeat risk.
        const projReady = ready ? committedReadiness(need, readiness) : 1;
        const projRisk = ready ? failureChance(projReady, nation) : 0;
        let pct = 0;
        if (active) {
          // endsAt already bakes in attrition, so match the total window here.
          const total = theatreDuration(t, active.stage, nation, upgrades, mods) * attritionMult(active.readiness ?? 1, nation) * 1000;
          pct = Math.min(100, Math.max(0, (1 - (active.endsAt - now) / total) * 100));
        }
        return (
          <div key={t.id} style={{ ...S.panel, borderColor: active ? "#D9B14B" : "#33506E" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ display: "flex", alignItems: "center", gap: 9 }}><GIcon name={THEATRE_ICON[t.icon] || "battle"} size={20} color="#D9B14B" /> {t.name}</strong>
              <span style={{ fontSize: 11, color: "#D9B14B" }}>{(stages[t.id] || 0)} victories</span>
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
          </div>
        );
      })}
    </>
  );
}
