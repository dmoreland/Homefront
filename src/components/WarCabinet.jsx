import { UPGRADES } from "../data/gameData.js";
import { canAfford } from "../game/economy.js";
import { costStr } from "../ui/format.js";
import { S } from "../ui/styles.js";

// Laws & upgrades bought with War Score or resources. Only shows upgrades that
// are unowned and whose prerequisite (if any) is met.
export function WarCabinet({ res, warScore, upgrades, onBuy }) {
  return (
    <>
      <h2 style={S.h2}>War Cabinet · Laws & Upgrades</h2>
      {UPGRADES.filter((u) => !upgrades[u.id] && (!u.req || upgrades[u.req])).map((u) => {
        const ok = u.ws ? warScore >= u.ws : canAfford(res, u.cost);
        return (
          <button key={u.id} onClick={() => onBuy(u)} disabled={!ok}
            style={{ ...S.btnRow, background: ok ? "#3A3016" : "#1E2F42", borderColor: "#D9B14B66", opacity: ok ? 1 : 0.55, cursor: ok ? "pointer" : "default" }}>
            <span><strong>{u.name}</strong><br /><span style={{ fontSize: 12, color: "#9FB4C7" }}>{u.desc}</span></span>
            <span style={{ color: "#D9B14B", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", marginLeft: 10 }}>{u.ws ? `${u.ws} ⭐` : costStr(u.cost)}</span>
          </button>
        );
      })}
    </>
  );
}
