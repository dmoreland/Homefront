export function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#D9B14B", color: "#16222E", fontWeight: 700, padding: "10px 18px", borderRadius: 999, fontSize: 13, boxShadow: "0 4px 14px rgba(0,0,0,0.5)", zIndex: 50, maxWidth: "90vw", textAlign: "center" }}>
      {message}
    </div>
  );
}
