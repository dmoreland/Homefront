import { BRANCHES, DOCTRINES } from "../data/doctrines.js";

// Between-runs doctrine tree. Points persist across campaigns and nations.
// Each node is buyable once its prerequisite is owned and you can afford it.
export function DoctrineHQ({ doctrines, onBuy, onBack }) {
  const nodeName = (id) => DOCTRINES.find((n) => n.id === id)?.name || id;

  return (
    <div style={{ minHeight: "100vh", background: "#16222E", color: "#EDE6D3", fontFamily: "'Trebuchet MS','Segoe UI',sans-serif", paddingBottom: 32 }}>
      <div style={{ padding: "28px 16px 6px", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#7E96AC", textTransform: "uppercase" }}>High Command · Permanent Doctrines</div>
        <h1 style={{ margin: "6px 0 0", fontSize: 26, letterSpacing: 1, color: "#D9B14B", fontWeight: 800 }}>DOCTRINE HQ</h1>
        <div style={{ fontSize: 14, color: "#EDE6D3", marginTop: 6 }}>
          <strong style={{ color: "#D9B14B" }}>{doctrines.points}</strong> doctrine point{doctrines.points === 1 ? "" : "s"} available
        </div>
        <div style={{ fontSize: 11, color: "#7E96AC", marginTop: 2 }}>Kept across runs and nations · earned by Total Victory</div>
      </div>

      <div style={{ maxWidth: 560, margin: "10px auto 0", padding: "0 14px" }}>
        {BRANCHES.map((branch) => (
          <div key={branch.id} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#D9B14B", letterSpacing: 1, margin: "10px 0 6px" }}>
              {branch.icon} {branch.name.toUpperCase()} <span style={{ color: "#7E96AC", fontWeight: 400, letterSpacing: 0 }}>· {branch.blurb}</span>
            </div>
            {DOCTRINES.filter((n) => n.branch === branch.id).map((n) => {
              const owned = !!doctrines.purchased[n.id];
              const locked = n.req && !doctrines.purchased[n.req];
              const affordable = !owned && !locked && doctrines.points >= n.cost;
              const border = owned ? "#6FBF73" : locked ? "#33506E" : affordable ? "#D9B14B" : "#33506E";
              return (
                <button key={n.id} onClick={() => onBuy(n)} disabled={!affordable}
                  style={{ width: "100%", textAlign: "left", marginBottom: 8, padding: "10px 12px", borderRadius: 10, color: "#EDE6D3", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${border}`, background: owned ? "#1E3327" : affordable ? "#3A3016" : "#1E2F42", opacity: owned || affordable ? 1 : 0.6, cursor: affordable ? "pointer" : "default" }}>
                  <span>
                    <strong>{n.name}</strong>{owned && <span style={{ color: "#6FBF73", marginLeft: 8, fontWeight: 700 }}>✓ Adopted</span>}<br />
                    <span style={{ fontSize: 12, color: "#9FB4C7" }}>{n.desc}{locked ? ` · requires ${nodeName(n.req)}` : ""}</span>
                  </span>
                  {!owned && <span style={{ color: affordable ? "#D9B14B" : "#5E7183", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", marginLeft: 10 }}>{n.cost} pt{n.cost === 1 ? "" : "s"}</span>}
                </button>
              );
            })}
          </div>
        ))}

        <button onClick={onBack} style={{ width: "100%", marginTop: 6, padding: "12px 0", fontSize: 14, fontWeight: 700, background: "linear-gradient(180deg,#3A5570,#2B4258)", color: "#EDE6D3", border: "2px solid #4E6E8E", borderRadius: 12, cursor: "pointer" }}>
          ← To nation select
        </button>
      </div>
    </div>
  );
}
