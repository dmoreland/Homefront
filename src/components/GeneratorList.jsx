import { canAfford, costOf } from "../game/economy.js";
import { costStr } from "../ui/format.js";
import { S } from "../ui/styles.js";

// Industry buildings for the active nation (producers, converters, and the
// Civilian Factory global multiplier — all bought the same generic way).
export function GeneratorList({ generators, owned, res, onBuy }) {
  return (
    <>
      <h2 style={S.h2}>Industry</h2>
      {generators.map((item) => {
        const n = owned[item.id] || 0;
        const cost = costOf(item.cost, n);
        const ok = canAfford(res, cost);
        return (
          <button key={item.id} onClick={() => onBuy(item)} disabled={!ok}
            style={{ ...S.btnRow, background: ok ? "#2A3F58" : "#1E2F42", opacity: ok ? 1 : 0.55, cursor: ok ? "pointer" : "default" }}>
            <span><strong>{item.name}</strong>{n > 0 && <span style={{ color: "#D9B14B", marginLeft: 8, fontWeight: 700 }}>×{n}</span>}<br />
              <span style={{ fontSize: 12, color: "#7E96AC" }}>{item.desc}</span></span>
            <span style={{ color: ok ? "#D9B14B" : "#5E7183", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", marginLeft: 10 }}>{costStr(cost)}</span>
          </button>
        );
      })}
    </>
  );
}
