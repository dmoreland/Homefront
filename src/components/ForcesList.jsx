import { canAfford } from "../game/economy.js";
import { effectiveForceCost } from "../game/doctrines.js";
import { mobiliseReadiness } from "../game/forces.js";
import { costStr } from "../ui/format.js";
import { GIcon, FORCE_ICON } from "../ui/Icon.jsx";
import { S } from "../ui/styles.js";

const upkeepStr = (upkeep) =>
  upkeep ? Object.entries(upkeep).map(([k, v]) => `${v} ${k}/s`).join(", ") : "";

const pct = (r) => `${Math.round(r * 100)}%`;
// Readiness bar colour: green when battle-ready, amber under-equipped, red near breaking.
const readyColor = (r) => (r >= 0.85 ? "#6FBF73" : r >= 0.6 ? "#D9B14B" : "#D08A6E");

// Forces recruit from equipment + manpower (manpower is a resource, so it's
// merged into the equipment stock for the affordability check). Costs reflect
// any Land/Sea/Air cost-reduction doctrines via effectiveForceCost.
//
// Two ways to raise a unit:
//   RECRUIT  — full equipment, readiness 1.0 (needs the whole equipment cost).
//   MOBILISE — send them in under-equipped at ANY readiness (even 0%): full
//              manpower, only the equipment on hand. Low readiness slows theatre
//              ops and risks defeat — but surplus equipment reinforces them toward
//              full over time (before it can raise new units).
export function ForcesList({ forces, res, eq, owned, readiness, mods, onRecruit, onMobilise }) {
  return (
    <>
      <h2 style={S.h2}>Armed Forces</h2>
      {forces.map((f) => {
        const cost = effectiveForceCost(f, mods);
        const stock = { ...eq, manpower: res.manpower };
        const ok = canAfford(stock, cost);
        // Readiness we'd deploy at right now; mobilise needs only the manpower.
        const mobR = mobiliseReadiness(cost, eq);
        const canMobilise = !ok && res.manpower >= (cost.manpower || 0);
        const count = owned[f.id] || 0;
        const avg = readiness[f.id] ?? 1;
        return (
          <div key={f.id} style={{ ...S.card, padding: 0, marginBottom: 8, background: "#22344A" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 11px 6px" }}>
              <span>
                <strong style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <GIcon name={FORCE_ICON[f.id]} size={17} color="#C7D2DC" /> {f.name}
                </strong>
                {count > 0 && <span style={{ color: "#D9B14B", marginLeft: 8, fontWeight: 700 }}>×{count}</span>}
                <br />
                <span style={{ fontSize: 12, color: "#7E96AC" }}>{costStr(cost)}{f.upkeep ? ` · upkeep ${upkeepStr(f.upkeep)}` : ""}</span>
              </span>
              {count > 0 && (
                <span style={{ textAlign: "right", minWidth: 66 }} title="Average readiness of this force — surplus equipment reinforces it toward full; low readiness slows operations and risks defeat">
                  <span style={{ fontSize: 11, color: "#7E96AC" }}>readiness</span><br />
                  <strong style={{ color: readyColor(avg), fontSize: 15 }}>{pct(avg)}</strong>
                  {avg < 0.999 && <span style={{ fontSize: 10, color: "#6FBF73", marginLeft: 4 }} title="Reinforcing as equipment allows">▲</span>}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 1 }}>
              <button onClick={() => onRecruit(f)} disabled={!ok}
                style={{ ...S.subBtn, flex: 1, background: ok ? "#2A3F58" : "#1E2F42", opacity: ok ? 1 : 0.55, cursor: ok ? "pointer" : "default", color: ok ? "#6FBF73" : "#5E7183" }}>
                RECRUIT
              </button>
              <button onClick={() => onMobilise(f)} disabled={!canMobilise}
                title={canMobilise ? `Deploy now at ${pct(mobR)} readiness — reinforces to full as equipment allows` : ok ? "Full recruitment available" : "Not enough manpower"}
                style={{ ...S.subBtn, flex: 1, background: canMobilise ? "#4A3A2A" : "#1E2F42", opacity: canMobilise ? 1 : 0.5, cursor: canMobilise ? "pointer" : "default", color: canMobilise ? "#E0A050" : "#5E7183" }}>
                {canMobilise ? `MOBILISE ${pct(mobR)}` : "MOBILISE"}
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
