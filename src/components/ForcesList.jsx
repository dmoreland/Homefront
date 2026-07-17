import { FORCES } from "../data/gameData.js";
import { canAfford } from "../game/economy.js";
import { costStr } from "../ui/format.js";
import { S } from "../ui/styles.js";

// Forces recruit from equipment + manpower (manpower is a resource, so it's
// merged into the equipment stock for the affordability check).
export function ForcesList({ res, eq, forces, onRecruit }) {
  return (
    <>
      <h2 style={S.h2}>His Majesty's Forces</h2>
      {FORCES.map((f) => {
        const stock = { ...eq, manpower: res.manpower };
        const ok = canAfford(stock, f.cost);
        return (
          <button key={f.id} onClick={() => onRecruit(f)} disabled={!ok}
            style={{ ...S.btnRow, background: ok ? "#2A3F58" : "#1E2F42", opacity: ok ? 1 : 0.55, cursor: ok ? "pointer" : "default" }}>
            <span><strong>{f.icon} {f.name}</strong>{(forces[f.id] || 0) > 0 && <span style={{ color: "#D9B14B", marginLeft: 8, fontWeight: 700 }}>×{forces[f.id]}</span>}<br />
              <span style={{ fontSize: 12, color: "#7E96AC" }}>{costStr(f.cost)}{f.upkeep ? ` · upkeep ${f.upkeep}` : ""}</span></span>
            <span style={{ color: ok ? "#6FBF73" : "#5E7183", fontWeight: 700, fontSize: 12 }}>{ok ? "RECRUIT" : "—"}</span>
          </button>
        );
      })}
    </>
  );
}
