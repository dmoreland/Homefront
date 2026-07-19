import { theatreDuration } from "../game/theatres.js";
import { effectiveNeed } from "../game/doctrines.js";
import { GIcon, THEATRE_ICON } from "../ui/Icon.jsx";
import { S } from "../ui/styles.js";

// Timed operations for the active nation: commit forces, watch the progress
// bar, collect the victory. `now` drives the countdown; the engine resolves
// completion on the tick. Requirements/durations reflect doctrine mods.
export function Theatres({ nation, stages, missions, forces, upgrades, mods, fuelStarved, now, onLaunch }) {
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
        let pct = 0;
        if (active) {
          const total = theatreDuration(t, active.stage, nation, upgrades, mods) * 1000;
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
                {fuelStarved && (t.air || t.naval) && (
                  <div style={{ fontSize: 11, color: "#E08A7A", fontWeight: 700, marginTop: 2 }}>⛽ Fuel shortage — operation slowed 50%</div>
                )}
              </div>
            ) : (
              <button onClick={() => onLaunch(t)} disabled={!ready}
                style={{ width: "100%", padding: "9px 0", fontSize: 13, fontWeight: 700, background: ready ? "linear-gradient(180deg,#D9B14B,#B8912F)" : "#1E2F42", color: ready ? "#16222E" : "#5E7183", border: "none", borderRadius: 8, cursor: ready ? "pointer" : "default", marginTop: 4 }}>
                {ready ? `LAUNCH OPERATION (Stage ${stage})` : `Requires ${needStr}`}
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
