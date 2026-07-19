import { LINES } from "../data/gameData.js";
import { canAfford, costOf } from "../game/economy.js";
import { costStr, fmt } from "../ui/format.js";
import { GIcon, EQUIP_ICON } from "../ui/Icon.jsx";
import { S } from "../ui/styles.js";

// Production lines buy like generators but surface a STALLED % when starved.
// `onBuy` is the same generic buy action used by Industry.
export function ProductionLines({ owned, res, eq, lineStatus, onBuy }) {
  return (
    <>
      <h2 style={S.h2}>Military Production</h2>
      {LINES.map((line) => {
        const n = owned[line.id] || 0;
        const cost = costOf(line.cost, n);
        const ok = canAfford(res, cost);
        const frac = lineStatus[line.id];
        const stalled = n > 0 && frac !== undefined && frac < 0.99;
        return (
          <button key={line.id} onClick={() => onBuy(line)} disabled={!ok}
            style={{ ...S.btnRow, background: ok ? "#2A3F58" : "#1E2F42", opacity: ok ? 1 : 0.55, cursor: ok ? "pointer" : "default", borderColor: stalled ? "#8E3B2E" : "#33506E" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <GIcon name={EQUIP_ICON[line.out]} size={22} color="#9FB4C7" />
              <span><strong>{line.name}</strong>{n > 0 && <span style={{ color: "#D9B14B", marginLeft: 8, fontWeight: 700 }}>×{n}</span>}
                {stalled && <span style={{ color: "#C96A5A", marginLeft: 8, fontSize: 11, fontWeight: 700 }}>STALLED {Math.round(frac * 100)}%</span>}<br />
                <span style={{ fontSize: 12, color: "#7E96AC" }}>{line.rate}/s {line.outName} · eats {costStr(line.cons)}/s each</span></span>
            </span>
            <span style={{ color: ok ? "#D9B14B" : "#5E7183", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", marginLeft: 10 }}>{costStr(cost)}</span>
          </button>
        );
      })}
      <div style={{ ...S.panel, display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 12, color: "#9FB4C7", alignItems: "center" }}>
        <span style={{ color: "#7E96AC", fontWeight: 700 }}>Stockpile:</span>
        {LINES.map((line) => (
          <span key={line.out} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <GIcon name={EQUIP_ICON[line.out]} size={15} color="#9FB4C7" /> {fmt(eq[line.out] || 0)} {line.outName.toLowerCase()}
          </span>
        ))}
      </div>
    </>
  );
}
