import { useState } from "react";

// Two-tap reset: first tap arms (4s window), second tap wipes the campaign.
export function Footer({ onReset }) {
  const [armed, setArmed] = useState(false);

  const handleReset = () => {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    setArmed(false);
    onReset();
  };

  return (
    <>
      <div style={{ textAlign: "center", fontSize: 11, color: "#4E6E8E", marginTop: 16 }}>
        Autosaves every 10s · offline production at 50% (8h cap) · theatre operations complete while away
      </div>
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <button onClick={handleReset} style={{ background: armed ? "#7A2E1E" : "transparent", color: armed ? "#EDE6D3" : "#4E6E8E", border: "1px solid #33506E", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
          {armed ? "Tap again to confirm — wipes everything" : "Reset campaign"}
        </button>
      </div>
    </>
  );
}
