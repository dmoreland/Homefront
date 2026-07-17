import { canAfford } from "../game/economy.js";
import { costStr } from "../ui/format.js";
import { S } from "../ui/styles.js";

const upkeepStr = (upkeep) =>
  upkeep ? Object.entries(upkeep).map(([k, v]) => `${v} ${k}/s`).join(", ") : "";

// Forces recruit from equipment + manpower (manpower is a resource, so it's
// merged into the equipment stock for the affordability check). Force defs and
// their names come from the active nation.
export function ForcesList({ forces, res, eq, owned, onRecruit }) {
  return (
    <>
      <h2 style={S.h2}>Armed Forces</h2>
      {forces.map((f) => {
        const stock = { ...eq, manpower: res.manpower };
        const ok = canAfford(stock, f.cost);
        return (
          <button key={f.id} onClick={() => onRecruit(f)} disabled={!ok}
            style={{ ...S.btnRow, background: ok ? "#2A3F58" : "#1E2F42", opacity: ok ? 1 : 0.55, cursor: ok ? "pointer" : "default" }}>
            <span><strong>{f.icon} {f.name}</strong>{(owned[f.id] || 0) > 0 && <span style={{ color: "#D9B14B", marginLeft: 8, fontWeight: 700 }}>×{owned[f.id]}</span>}<br />
              <span style={{ fontSize: 12, color: "#7E96AC" }}>{costStr(f.cost)}{f.upkeep ? ` · upkeep ${upkeepStr(f.upkeep)}` : ""}</span></span>
            <span style={{ color: ok ? "#6FBF73" : "#5E7183", fontWeight: 700, fontSize: 12 }}>{ok ? "RECRUIT" : "—"}</span>
          </button>
        );
      })}
    </>
  );
}
