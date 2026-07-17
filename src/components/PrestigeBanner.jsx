// Shown at the top of the campaign once Total Victory is reached (every theatre
// at Stage 3+). Prestiging banks doctrine points and returns to the picker.
export function PrestigeBanner({ award, onPrestige }) {
  return (
    <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 12, background: "linear-gradient(180deg,#3A3016,#4A3A12)", border: "1px solid #D9B14B" }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#D9B14B", letterSpacing: 1 }}>🏅 TOTAL VICTORY</div>
      <div style={{ fontSize: 12, color: "#EDE6D3", margin: "4px 0 8px" }}>
        Every theatre is won. Prestige to bank <strong>{award} doctrine point{award === 1 ? "" : "s"}</strong> and begin a new, stronger campaign.
      </div>
      <button onClick={onPrestige} style={{ width: "100%", padding: "10px 0", fontSize: 14, fontWeight: 800, background: "linear-gradient(180deg,#D9B14B,#B8912F)", color: "#16222E", border: "none", borderRadius: 8, cursor: "pointer", letterSpacing: 1 }}>
        PRESTIGE (+{award} ⚙️ doctrine points)
      </button>
    </div>
  );
}
