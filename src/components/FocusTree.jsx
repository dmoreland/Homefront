import { focusAvailable } from "../game/focus.js";
import { S } from "../ui/styles.js";

// National Focus tree — the nation's timed strategy track. One focus runs at a
// time (progress bar + countdown, driven by `now`); completed focuses persist for
// the run. Each focus is done / in-progress / available (a "Begin" button) /
// locked (prereq not met). Mirrors the DoctrineHQ / Theatres visual patterns.
export function FocusTree({ nation, focus, now, onStart }) {
  const focuses = nation.focuses || [];
  if (!focuses.length) return null;
  const done = focus?.done || {};
  const active = focus?.active || null;
  const byId = Object.fromEntries(focuses.map((f) => [f.id, f]));
  const focusName = (id) => byId[id]?.name || id;

  return (
    <>
      <h2 style={S.h2}>National Focus</h2>
      {focuses.map((f) => {
        const isDone = !!done[f.id];
        const isActive = active && active.id === f.id;
        const canStart = focusAvailable(f, focus); // prereqs met AND nothing else running
        const reqUnmet = f.req ? [].concat(f.req).filter((r) => !done[r]) : [];
        const dim = !isDone && !isActive && !canStart; // locked or blocked by another focus

        let secsLeft = 0, pct = 0;
        if (isActive) {
          secsLeft = Math.max(0, Math.ceil((active.endsAt - now) / 1000));
          pct = Math.min(100, Math.max(0, (1 - (active.endsAt - now) / (f.time * 1000)) * 100));
        }

        const border = isDone ? "#6FBF73" : (isActive || canStart) ? "#D9B14B" : "#33506E";
        const bg = isDone ? "#1E3327" : isActive ? "#3A3016" : canStart ? "#22344A" : "#1E2F42";
        const disabledReason = reqUnmet.length ? "Prerequisite not met" : "Another focus is in progress";

        return (
          <div key={f.id} style={{ ...S.panel, borderColor: border, background: bg, opacity: dim ? 0.6 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span>
                <strong>{f.name}</strong>
                {isDone && <span style={{ color: "#6FBF73", marginLeft: 8, fontWeight: 700 }}>✓ Completed</span>}
                <br />
                <span style={{ fontSize: 12, color: "#9FB4C7" }}>
                  {f.desc}
                  {reqUnmet.length ? ` · requires ${reqUnmet.map(focusName).join(", ")}` : ""}
                </span>
              </span>
              {!isDone && !isActive && (
                <button onClick={() => onStart(f)} disabled={!canStart}
                  title={canStart ? `Takes ${f.time}s` : disabledReason}
                  style={{ padding: "7px 12px", fontSize: 12, fontWeight: 700, borderRadius: 8, whiteSpace: "nowrap", border: "none",
                    background: canStart ? "linear-gradient(180deg,#D9B14B,#B8912F)" : "#1E2F42",
                    color: canStart ? "#16222E" : "#5E7183", cursor: canStart ? "pointer" : "default" }}>
                  {canStart ? `Begin · ${f.time}s` : `${f.time}s`}
                </button>
              )}
            </div>
            {isActive && (
              <div style={{ marginTop: 8 }}>
                <div style={{ background: "#16222E", borderRadius: 6, height: 8, overflow: "hidden", margin: "0 0 4px" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#D9B14B" }} />
                </div>
                <div style={{ fontSize: 11, color: "#D9B14B" }}>📋 In progress — {secsLeft}s remaining</div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
