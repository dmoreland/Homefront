export function Foundry({ shift, onTap }) {
  return (
    <button onClick={onTap} style={{ width: "100%", marginTop: 12, padding: "16px 0", fontSize: 17, fontWeight: 800, background: "linear-gradient(180deg,#3A5570,#2B4258)", color: "#EDE6D3", border: "2px solid #4E6E8E", borderRadius: 14, cursor: "pointer", letterSpacing: 1 }}>
      ⚒️ WORK THE FOUNDRY (+{shift ? 6 : 2} steel)
    </button>
  );
}
