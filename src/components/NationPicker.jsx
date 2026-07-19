import { Flag } from "./Flag.jsx";
import { Roundel } from "./Roundel.jsx";

// Faction display order + labels. Nations without a faction fall into "Other".
const FACTIONS = [
  { id: "Allies", label: "Allies" },
  { id: "Axis", label: "Axis" },
  { id: "Soviet", label: "Soviet Union" },
];

// Campaign start screen: choose a nation, grouped by faction. Each card shows
// the nation's era, a one-line identity, and flavour. Selecting one starts a
// fresh campaign. Doctrine points (earned across runs) link into Doctrine HQ.
export function NationPicker({ nations, doctrinePoints = 0, onSelect, onOpenDoctrines }) {
  const groups = FACTIONS
    .map((f) => ({ ...f, members: nations.filter((n) => n.faction === f.id) }))
    .filter((g) => g.members.length);
  const ungrouped = nations.filter((n) => !FACTIONS.some((f) => f.id === n.faction));
  if (ungrouped.length) groups.push({ id: "Other", label: "Other", members: ungrouped });

  return (
    <div style={{ minHeight: "100vh", background: "#16222E", color: "#EDE6D3", fontFamily: "'Trebuchet MS','Segoe UI',sans-serif", paddingBottom: 32 }}>
      <div style={{ padding: "40px 16px 6px", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#7E96AC", textTransform: "uppercase" }}>Ministry of War · Choose your nation</div>
        <h1 style={{ margin: "6px 0 0", fontSize: 30, letterSpacing: 1, color: "#D9B14B", fontWeight: 800 }}>HOME FRONT</h1>
        <div style={{ fontSize: 12, color: "#7E96AC", marginTop: 4 }}>Build a war economy. Each nation plays differently.</div>
        <button onClick={onOpenDoctrines} style={{ marginTop: 12, padding: "8px 16px", fontSize: 12, fontWeight: 700, background: "#22344A", color: "#D9B14B", border: "1px solid #D9B14B66", borderRadius: 999, cursor: "pointer" }}>
          🎖️ Doctrine HQ · {doctrinePoints} pt{doctrinePoints === 1 ? "" : "s"}
        </button>
      </div>

      <div style={{ maxWidth: 560, margin: "18px auto 0", padding: "0 14px" }}>
        {groups.map((g) => (
          <div key={g.id} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#D9B14B", letterSpacing: 2, textTransform: "uppercase", margin: "6px 2px 8px" }}>{g.label}</div>
            <div style={{ display: "grid", gap: 12 }}>
              {g.members.map((n) => (
                <button key={n.id} onClick={() => onSelect(n.id)}
                  style={{ textAlign: "left", background: "#22344A", border: "1px solid #33506E", borderRadius: 12, padding: "16px 18px", color: "#EDE6D3", cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Flag nation={n.id} width={46} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <strong style={{ fontSize: 18, color: "#D9B14B", display: "flex", alignItems: "center", gap: 7 }}><Roundel nation={n.id} size={17} /> {n.name}</strong>
                        <span style={{ fontSize: 11, letterSpacing: 2, color: "#7E96AC", textTransform: "uppercase" }}>{n.year}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#8FA37A", fontWeight: 700, marginTop: 4 }}>{n.identity}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#9FB4C7", lineHeight: 1.4, marginTop: 8 }}>{n.blurb}</div>
                  <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "#D9B14B" }}>Begin campaign →</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "#4E6E8E", marginTop: 6 }}>
        Saves are local to this browser · no account, no backend
      </div>
    </div>
  );
}
