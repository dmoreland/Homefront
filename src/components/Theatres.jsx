import { FORCES, THEATRES } from "../data/gameData.js";
import { S } from "../ui/styles.js";

// Timed operations: commit forces, watch the progress bar, collect the victory.
// `now` drives the countdown; the engine resolves completion on the tick.
export function Theatres({ stages, missions, forces, upgrades, now, onLaunch }) {
  return (
    <>
      <h2 style={S.h2}>Theatres of War</h2>
      {THEATRES.map((t) => {
        const stage = (stages[t.id] || 0) + 1;
        const need = t.need(stage);
        const active = missions.find((m) => m.theatre === t.id);
        const ready = !active && Object.keys(need).every((k) => (forces[k] || 0) >= need[k]);
        const needStr = Object.entries(need).map(([k, v]) => `${v}× ${FORCES.find((f) => f.id === k).name}`).join(" + ");
        return (
          <div key={t.id} style={{ ...S.panel, borderColor: active ? "#D9B14B" : "#33506E" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{t.icon} {t.name}</strong>
              <span style={{ fontSize: 11, color: "#D9B14B" }}>{(stages[t.id] || 0)} victories</span>
            </div>
            <div style={{ fontSize: 12, color: "#7E96AC", margin: "4px 0" }}>{t.reward}</div>
            {active ? (
              <div>
                <div style={{ background: "#16222E", borderRadius: 6, height: 8, overflow: "hidden", margin: "6px 0 4px" }}>
                  <div style={{ width: `${Math.min(100, 100 - ((active.endsAt - now) / (active.endsAt - (active.endsAt - t.dur * Math.pow(1.3, active.stage - 1) * (upgrades.radar && (t.air || t.naval) ? 0.75 : 1) * 1000))) * 100)}%`, height: "100%", background: "#D9B14B" }} />
                </div>
                <div style={{ fontSize: 11, color: "#D9B14B" }}>⚔️ Engaged — {Math.max(0, Math.ceil((active.endsAt - now) / 1000))}s remaining</div>
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
