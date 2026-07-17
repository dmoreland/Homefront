// Campaign start screen: choose a nation. Each card shows the nation's era,
// a one-line identity, and flavour. Selecting one starts a fresh campaign.
export function NationPicker({ nations, onSelect }) {
  return (
    <div style={{ minHeight: "100vh", background: "#16222E", color: "#EDE6D3", fontFamily: "'Trebuchet MS','Segoe UI',sans-serif", paddingBottom: 32 }}>
      <div style={{ padding: "40px 16px 6px", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#7E96AC", textTransform: "uppercase" }}>Ministry of War · Choose your nation</div>
        <h1 style={{ margin: "6px 0 0", fontSize: 30, letterSpacing: 1, color: "#D9B14B", fontWeight: 800 }}>HOME FRONT</h1>
        <div style={{ fontSize: 12, color: "#7E96AC", marginTop: 4 }}>Build a war economy. Each nation plays differently.</div>
      </div>

      <div style={{ maxWidth: 560, margin: "18px auto 0", padding: "0 14px", display: "grid", gap: 12 }}>
        {nations.map((n) => (
          <button key={n.id} onClick={() => onSelect(n.id)}
            style={{ textAlign: "left", background: "#22344A", border: "1px solid #33506E", borderRadius: 12, padding: "16px 18px", color: "#EDE6D3", cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <strong style={{ fontSize: 18, color: "#D9B14B" }}>{n.name}</strong>
              <span style={{ fontSize: 11, letterSpacing: 2, color: "#7E96AC", textTransform: "uppercase" }}>{n.year}</span>
            </div>
            <div style={{ fontSize: 12, color: "#8FA37A", fontWeight: 700, margin: "6px 0 4px" }}>{n.identity}</div>
            <div style={{ fontSize: 13, color: "#9FB4C7", lineHeight: 1.4 }}>{n.blurb}</div>
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "#D9B14B" }}>Begin campaign →</div>
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "#4E6E8E", marginTop: 24 }}>
        Saves are local to this browser · no account, no backend
      </div>
    </div>
  );
}
