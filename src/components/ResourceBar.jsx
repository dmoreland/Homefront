import { RES } from "../data/gameData.js";
import { fmt } from "../ui/format.js";

// Five-resource strip showing current stock and NET flow (generation minus
// line consumption and upkeep). Deficit cards turn red with a ▼ marker.
export function ResourceBar({ res, net }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginTop: 12 }}>
      {RES.map((r) => {
        const rate = net[r.key];
        const deficit = rate < -0.001;
        return (
          <div key={r.key} style={{ background: deficit ? "#3A2320" : "#22344A", borderRadius: 8, padding: "6px 4px", textAlign: "center", border: `1px solid ${deficit ? "#8E3B2E" : "#33506E"}` }}>
            <div style={{ fontSize: 13 }}>{r.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: deficit ? "#E08A7A" : r.color }}>{fmt(res[r.key])}</div>
            <div style={{ fontSize: 9, fontWeight: deficit ? 700 : 400, color: deficit ? "#E08A7A" : "#7E96AC" }}>
              {deficit ? "▼ " : "+"}{fmt(Math.abs(rate))}/s
            </div>
          </div>
        );
      })}
    </div>
  );
}
