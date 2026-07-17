import React, { useState, useEffect, useRef, useMemo } from "react";

// =====================================================
// HOME FRONT — a WW2 industrial idle game (v1: United Kingdom)
// Resource chain: raw resources -> production lines -> equipment
// -> divisions/wings/fleets -> theatre victories -> bonuses & War Score
// =====================================================

const RES = [
  { key: "steel", label: "Steel", icon: "⚙️", color: "#B8C4CE" },
  { key: "alu", label: "Aluminium", icon: "🧱", color: "#9FB4C7" },
  { key: "oil", label: "Oil", icon: "🛢️", color: "#C9A227" },
  { key: "rubber", label: "Rubber", icon: "🛞", color: "#8FA37A" },
  { key: "manpower", label: "Manpower", icon: "👥", color: "#D9B14B" },
];

const GENERATORS = [
  { id: "mill", name: "Steel Mill", desc: "+1.0 steel/sec", cost: { steel: 20 } },
  { id: "smelter", name: "Aluminium Smelter", desc: "+0.5 aluminium/sec", cost: { steel: 60 } },
  { id: "refinery", name: "Oil Refinery", desc: "+0.5 oil/sec", cost: { steel: 140 } },
  { id: "plantation", name: "Colonial Plantation", desc: "+0.4 rubber/sec", cost: { steel: 120, oil: 20 } },
  { id: "civ", name: "Civilian Factory", desc: "+10% all resource output", cost: { steel: 400 } },
];

const LINES = [
  { id: "rifleLine", name: "Rifle Line", out: "rifles", outName: "Rifles", rate: 0.5, cons: { steel: 1 }, cost: { steel: 150 } },
  { id: "artyLine", name: "Artillery Line", out: "artillery", outName: "Artillery", rate: 0.2, cons: { steel: 2 }, cost: { steel: 450 } },
  { id: "tankLine", name: "Tank Line", out: "tanks", outName: "Tanks", rate: 0.1, cons: { steel: 3, rubber: 0.3 }, cost: { steel: 1200, rubber: 80 } },
  { id: "fighterLine", name: "Fighter Line", out: "fighters", outName: "Fighters", rate: 0.1, cons: { alu: 2, rubber: 0.3 }, cost: { steel: 1000, alu: 150 } },
  { id: "shipyard", name: "Shipyard", out: "ships", outName: "Warships", rate: 0.05, cons: { steel: 5, oil: 0.5 }, cost: { steel: 2600 } },
];

const FORCES = [
  { id: "inf", name: "Infantry Division", icon: "🪖", cost: { rifles: 40, artillery: 10, manpower: 80 } },
  { id: "arm", name: "Armoured Division", icon: "🚜", cost: { tanks: 15, artillery: 5, manpower: 40 } },
  { id: "air", name: "Air Wing", icon: "✈️", cost: { fighters: 12, manpower: 30 }, upkeep: "0.2 oil/s" },
  { id: "fleet", name: "Fleet", icon: "⚓", cost: { ships: 5, manpower: 60 }, upkeep: "0.4 oil/s" },
];

const THEATRES = [
  { id: "bob", name: "Battle of Britain", icon: "✈️", dur: 90, need: (st) => ({ air: 2 * st }), reward: "+15% steel & aluminium output per victory", air: true },
  { id: "atlantic", name: "Battle of the Atlantic", icon: "⚓", dur: 120, need: (st) => ({ fleet: 2 * st }), reward: "+0.5 oil & rubber/sec convoys per victory", naval: true },
  { id: "africa", name: "North Africa", icon: "🏜️", dur: 150, need: (st) => ({ inf: 3 * st, arm: 1 * st }), reward: "+1 oil/sec Middle East fields per victory" },
];

const UPGRADES = [
  { id: "shift", name: "Shift Work", desc: "Foundry taps produce 3× steel", cost: { steel: 300 } },
  { id: "radar", name: "Radar Network", desc: "Air & naval theatres resolve 25% faster", ws: 3 },
  { id: "law1", name: "Limited Conscription", desc: "Manpower growth ×2", ws: 2 },
  { id: "law2", name: "Extensive Conscription", desc: "Manpower growth ×4", ws: 6, req: "law1" },
  { id: "law3", name: "Service by Requirement", desc: "Manpower growth ×8", ws: 15, req: "law2" },
];

const fmt = (n) => {
  if (n < 1000) return n < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.floor(n).toLocaleString();
  const u = ["K", "M", "B", "T"];
  let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return n.toFixed(n < 100 ? 1 : 0) + u[i];
};
const costOf = (base, owned) => {
  const c = {};
  for (const k in base) c[k] = Math.ceil(base[k] * Math.pow(1.15, owned));
  return c;
};
const canAfford = (stock, cost) => Object.keys(cost).every((k) => (stock[k] || 0) >= cost[k]);

// Pure simulation step — used by the live tick AND offline earnings
function simulate(s, dt) {
  const civMult = 1 + 0.1 * (s.owned.civ || 0);
  const lawMult = s.upgrades.law3 ? 8 : s.upgrades.law2 ? 4 : s.upgrades.law1 ? 2 : 1;
  const bobMult = 1 + 0.15 * (s.stages.bob || 0);
  const res = { ...s.res };
  const eq = { ...s.eq };

  const gen = {
    steel: (s.owned.mill || 0) * 1 * civMult * bobMult,
    alu: (s.owned.smelter || 0) * 0.5 * civMult * bobMult,
    oil: (s.owned.refinery || 0) * 0.5 * civMult + 0.2 + (s.stages.africa || 0) * 1 + (s.stages.atlantic || 0) * 0.5,
    rubber: (s.owned.plantation || 0) * 0.4 * civMult + 0.2 + (s.stages.atlantic || 0) * 0.5,
    manpower: 0.5 * lawMult,
  };
  const upkeep = (s.forces.air || 0) * 0.2 + (s.forces.fleet || 0) * 0.4;

  res.steel += gen.steel * dt;
  res.alu += gen.alu * dt;
  res.oil = Math.max(0, res.oil + (gen.oil - upkeep) * dt);
  res.rubber += gen.rubber * dt;
  res.manpower += gen.manpower * dt;

  const lineStatus = {};
  const cons = { steel: 0, alu: 0, oil: 0, rubber: 0, manpower: 0 };
  for (const line of LINES) {
    const n = s.owned[line.id] || 0;
    if (!n) continue;
    let frac = 1;
    for (const k in line.cons) {
      const need = line.cons[k] * n * dt;
      frac = Math.min(frac, need > 0 ? res[k] / need : 1);
    }
    frac = Math.max(0, Math.min(1, frac));
    for (const k in line.cons) {
      res[k] -= line.cons[k] * n * dt * frac;
      cons[k] += line.cons[k] * n * frac; // per-second rate at current throttle
    }
    eq[line.out] = (eq[line.out] || 0) + line.rate * n * dt * frac;
    lineStatus[line.id] = frac;
  }
  // Net flow per resource — what the stockpile is actually doing
  const net = {
    steel: gen.steel - cons.steel,
    alu: gen.alu - cons.alu,
    oil: gen.oil - upkeep - cons.oil,
    rubber: gen.rubber - cons.rubber,
    manpower: gen.manpower,
  };
  return { res, eq, gen, net, upkeep, lineStatus };
}

// Persistence — window.storage in artifacts, localStorage when deployed
const SAVE_KEY = "home-front-uk-save";
const saveStore = {
  async load() {
    try {
      if (typeof window !== "undefined" && window.storage) {
        const r = await window.storage.get(SAVE_KEY);
        return r?.value ? JSON.parse(r.value) : null;
      }
    } catch { /* fall through */ }
    try { const raw = window.localStorage?.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  async save(data) {
    const json = JSON.stringify(data);
    try { if (window.storage) { await window.storage.set(SAVE_KEY, json); return; } } catch { /* fall through */ }
    try { window.localStorage?.setItem(SAVE_KEY, json); } catch { /* ignore */ }
  },
  async clear() {
    try { if (window.storage) await window.storage.delete(SAVE_KEY); } catch { /* ignore */ }
    try { window.localStorage?.removeItem(SAVE_KEY); } catch { /* ignore */ }
  },
};

const FRESH = {
  res: { steel: 0, alu: 0, oil: 0, rubber: 0, manpower: 0 },
  eq: { rifles: 0, artillery: 0, tanks: 0, fighters: 0, ships: 0 },
  owned: {}, upgrades: {}, forces: {}, stages: {}, missions: [], warScore: 0, taps: 0,
};

export default function HomeFrontUK() {
  const [game, setGame] = useState(FRESH);
  const [toast, setToast] = useState(null);
  const [armReset, setArmReset] = useState(false);
  const [now, setNow] = useState(Date.now());
  const loadedRef = useRef(false);
  const gameRef = useRef(game);
  gameRef.current = game;

  const say = (msg, ms = 3500) => { setToast(msg); setTimeout(() => setToast(null), ms); };

  const sim = useMemo(() => simulate(game, 1), [game]);

  // Load + offline progress
  useEffect(() => {
    (async () => {
      const save = await saveStore.load();
      if (save) {
        let g = { ...FRESH, ...save };
        // Resolve missions that finished while away
        const done = (g.missions || []).filter((m) => m.endsAt <= Date.now());
        for (const m of done) {
          g.stages = { ...g.stages, [m.theatre]: (g.stages[m.theatre] || 0) + 1 };
          g.warScore += m.stage;
          const f = { ...g.forces };
          for (const k in m.forces) f[k] = (f[k] || 0) + m.forces[k];
          g.forces = f;
        }
        g.missions = (g.missions || []).filter((m) => m.endsAt > Date.now());
        // Offline resources at 50%, capped 8h
        if (save.savedAt) {
          const elapsed = Math.min((Date.now() - save.savedAt) / 1000, 8 * 3600);
          if (elapsed > 30) {
            const r = simulate(g, elapsed * 0.5);
            g = { ...g, res: r.res, eq: r.eq };
            say(`🏭 The home front kept working: +${fmt(r.gen.steel * elapsed * 0.5)} steel while you were away`, 5000);
          }
        }
        if (done.length) say(`🎖️ ${done.length} theatre victor${done.length > 1 ? "ies" : "y"} while you were away!`, 5000);
        setGame(g);
      }
      loadedRef.current = true;
    })();
  }, []);

  // Tick
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setGame((g) => {
        const r = simulate(g, 0.25);
        let next = { ...g, res: r.res, eq: r.eq };
        // Mission completion
        const done = g.missions.filter((m) => m.endsAt <= Date.now());
        if (done.length) {
          const stages = { ...g.stages };
          const forces = { ...g.forces };
          let ws = g.warScore;
          for (const m of done) {
            stages[m.theatre] = (stages[m.theatre] || 0) + 1;
            ws += m.stage;
            for (const k in m.forces) forces[k] = (forces[k] || 0) + m.forces[k];
            const t = THEATRES.find((t) => t.id === m.theatre);
            setTimeout(() => say(`🎖️ Victory in the ${t.name}! +${m.stage} War Score`), 0);
          }
          next = { ...next, stages, forces, warScore: ws, missions: g.missions.filter((m) => m.endsAt > Date.now()) };
        }
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, []);

  // Autosave
  useEffect(() => {
    const id = setInterval(() => {
      if (loadedRef.current) saveStore.save({ ...gameRef.current, savedAt: Date.now() });
    }, 10000);
    const onHide = () => {
      if (loadedRef.current && document.visibilityState === "hidden")
        saveStore.save({ ...gameRef.current, savedAt: Date.now() });
    };
    document.addEventListener("visibilitychange", onHide);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onHide); };
  }, []);

  // ---------- Actions ----------
  const tap = () => setGame((g) => ({
    ...g,
    res: { ...g.res, steel: g.res.steel + (g.upgrades.shift ? 6 : 2) },
    taps: g.taps + 1,
  }));

  const pay = (g, cost) => {
    const res = { ...g.res }, eq = { ...g.eq };
    for (const k in cost) {
      if (k in res) res[k] -= cost[k];
      else eq[k] -= cost[k];
    }
    return { ...g, res, eq };
  };

  const buyGen = (item) => setGame((g) => {
    const cost = costOf(item.cost, g.owned[item.id] || 0);
    if (!canAfford(g.res, cost)) return g;
    return { ...pay(g, cost), owned: { ...g.owned, [item.id]: (g.owned[item.id] || 0) + 1 } };
  });

  const recruit = (f) => setGame((g) => {
    const stock = { ...g.eq, manpower: g.res.manpower };
    if (!canAfford(stock, f.cost)) return g;
    return { ...pay(g, f.cost), forces: { ...g.forces, [f.id]: (g.forces[f.id] || 0) + 1 } };
  });

  const buyUpgrade = (u) => setGame((g) => {
    if (g.upgrades[u.id]) return g;
    if (u.req && !g.upgrades[u.req]) return g;
    if (u.ws) {
      if (g.warScore < u.ws) return g;
      return { ...g, warScore: g.warScore - u.ws, upgrades: { ...g.upgrades, [u.id]: true } };
    }
    if (!canAfford(g.res, u.cost)) return g;
    return { ...pay(g, u.cost), upgrades: { ...g.upgrades, [u.id]: true } };
  });

  const launch = (t) => setGame((g) => {
    if (g.missions.some((m) => m.theatre === t.id)) return g;
    const stage = (g.stages[t.id] || 0) + 1;
    const need = t.need(stage);
    for (const k in need) if ((g.forces[k] || 0) < need[k]) return g;
    const forces = { ...g.forces };
    for (const k in need) forces[k] -= need[k];
    let dur = t.dur * Math.pow(1.3, stage - 1);
    if (g.upgrades.radar && (t.air || t.naval)) dur *= 0.75;
    return { ...g, forces, missions: [...g.missions, { theatre: t.id, stage, forces: need, endsAt: Date.now() + dur * 1000 }] };
  });

  const resetAll = async () => {
    if (!armReset) { setArmReset(true); setTimeout(() => setArmReset(false), 4000); return; }
    await saveStore.clear();
    setGame(FRESH); setArmReset(false);
    say("🇬🇧 A fresh mobilisation begins");
  };

  // ---------- UI ----------
  const S = {
    panel: { background: "#22344A", border: "1px solid #33506E", borderRadius: 10, padding: "10px 12px", marginBottom: 8 },
    h2: { fontSize: 12, letterSpacing: 2, color: "#D9B14B", textTransform: "uppercase", margin: "18px 0 8px", fontWeight: 700 },
    btnRow: { width: "100%", textAlign: "left", marginBottom: 8, padding: "10px 12px", borderRadius: 10, color: "#EDE6D3", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #33506E" },
  };
  const costStr = (cost) => Object.entries(cost).map(([k, v]) => {
    const r = RES.find((r) => r.key === k);
    const line = LINES.find((l) => l.out === k);
    return `${fmt(v)} ${r ? r.icon : line ? line.outName.toLowerCase() : k}`;
  }).join(" · ");

  const airCount = Math.min(3, game.forces.air || 0);
  const fleetCount = Math.min(3, game.forces.fleet || 0);
  const factoryCount = Math.min(4, (game.owned.mill || 0) + (game.owned.civ || 0));

  return (
    <div style={{ minHeight: "100vh", background: "#16222E", color: "#EDE6D3", fontFamily: "'Trebuchet MS','Segoe UI',sans-serif", paddingBottom: 32 }}>
      <div style={{ padding: "18px 16px 6px", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#7E96AC", textTransform: "uppercase" }}>1940 · United Kingdom · v1</div>
        <h1 style={{ margin: "4px 0 0", fontSize: 26, letterSpacing: 1, color: "#D9B14B", fontWeight: 800 }}>HOME FRONT</h1>
        <div style={{ fontSize: 12, color: "#7E96AC" }}>War Score: <span style={{ color: "#D9B14B", fontWeight: 700 }}>{game.warScore} ⭐</span> · spend it on laws & doctrine</div>
      </div>

      {/* Scene: blackout skyline, barrage balloons, Spitfires, the Channel */}
      <svg viewBox="0 0 100 36" style={{ width: "100%", display: "block", marginTop: 4 }} preserveAspectRatio="xMidYMax meet">
        <rect x="0" y="0" width="100" height="36" fill="#0E1822" />
        <circle cx="86" cy="6" r="2.6" fill="#EDE6D3" opacity="0.85" />
        {/* land + white cliffs + sea */}
        <path d="M0,36 L0,24 L62,24 L62,28 L64,28 L64,36 Z" fill="#1C2B3A" />
        <rect x="62" y="24" width="2.2" height="6" fill="#D8D4C4" />
        <rect x="64" y="29" width="36" height="7" fill="#132534" />
        <path d="M64,29.5 Q75,28.8 86,29.5 T100,29.3" stroke="#2E4B63" strokeWidth="0.5" fill="none" />
        {/* factories appear with industry */}
        {Array.from({ length: factoryCount }).map((_, i) => {
          const x = 6 + i * 12;
          return (
            <g key={i}>
              <rect x={x} y="19" width="8" height="5" fill="#26394E" />
              <path d={`M${x},19 L${x + 2.6},17.3 L${x + 2.6},19 L${x + 5.3},17.3 L${x + 5.3},19 L${x + 8},17.3 L${x + 8},19`} fill="#26394E" />
              <rect x={x + 6.4} y="13.5" width="1.1" height="5.5" fill="#31465C" />
              <circle cx={x + 7} cy="12.6" r="0.9" fill="#4A6076" opacity="0.5">
                <animate attributeName="cy" values="12.6;10.8;12.6" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="4s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
        {/* barrage balloons */}
        {[{ x: 18, y: 7 }, { x: 44, y: 5 }].map((b, i) => (
          <g key={i}>
            <ellipse cx={b.x} cy={b.y} rx="3" ry="1.7" fill="#7E96AC" opacity="0.8">
              <animate attributeName="cy" values={`${b.y};${b.y - 0.6};${b.y}`} dur={`${6 + i * 2}s`} repeatCount="indefinite" />
            </ellipse>
            <line x1={b.x} y1={b.y + 1.5} x2={b.x - 2} y2="24" stroke="#4A6076" strokeWidth="0.15" />
          </g>
        ))}
        {/* Spitfires when you have air wings */}
        {Array.from({ length: airCount }).map((_, i) => (
          <g key={i}>
            <path d="M-1.4,0 L1.4,0 M0,-0.9 L0,0.5 M-0.5,0.9 L0.5,0.9" stroke="#D9B14B" strokeWidth="0.4" />
            <animateMotion dur={`${11 + i * 4}s`} begin={`${-i * 5}s`} repeatCount="indefinite" path="M-4,10 Q30,7 60,11 T104,9" />
          </g>
        ))}
        {/* fleet in the Channel */}
        {Array.from({ length: fleetCount }).map((_, i) => {
          const x = 70 + i * 10;
          return (
            <g key={i}>
              <path d={`M${x},31 L${x + 6},31 L${x + 5},32.6 L${x + 1},32.6 Z`} fill="#3A5570" />
              <rect x={x + 2.4} y="29.6" width="1.2" height="1.4" fill="#3A5570" />
              <animateTransform attributeName="transform" type="translate" values="0,0;0,0.35;0,0" dur={`${3 + i}s`} repeatCount="indefinite" />
            </g>
          );
        })}
      </svg>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 14px" }}>
        {/* Resource bar — shows NET flow (generation minus lines & upkeep) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginTop: 12 }}>
          {RES.map((r) => {
            const rate = sim.net[r.key];
            const deficit = rate < -0.001;
            return (
              <div key={r.key} style={{ background: deficit ? "#3A2320" : "#22344A", borderRadius: 8, padding: "6px 4px", textAlign: "center", border: `1px solid ${deficit ? "#8E3B2E" : "#33506E"}` }}>
                <div style={{ fontSize: 13 }}>{r.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: deficit ? "#E08A7A" : r.color }}>{fmt(game.res[r.key])}</div>
                <div style={{ fontSize: 9, fontWeight: deficit ? 700 : 400, color: deficit ? "#E08A7A" : "#7E96AC" }}>
                  {deficit ? "▼ " : "+"}{fmt(Math.abs(rate))}/s
                </div>
              </div>
            );
          })}
        </div>

        {/* Tap */}
        <button onClick={tap} style={{ width: "100%", marginTop: 12, padding: "16px 0", fontSize: 17, fontWeight: 800, background: "linear-gradient(180deg,#3A5570,#2B4258)", color: "#EDE6D3", border: "2px solid #4E6E8E", borderRadius: 14, cursor: "pointer", letterSpacing: 1 }}>
          ⚒️ WORK THE FOUNDRY (+{game.upgrades.shift ? 6 : 2} steel)
        </button>

        {/* Industry */}
        <h2 style={S.h2}>Industry</h2>
        {GENERATORS.map((item) => {
          const n = game.owned[item.id] || 0;
          const cost = costOf(item.cost, n);
          const ok = canAfford(game.res, cost);
          return (
            <button key={item.id} onClick={() => buyGen(item)} disabled={!ok}
              style={{ ...S.btnRow, background: ok ? "#2A3F58" : "#1E2F42", opacity: ok ? 1 : 0.55, cursor: ok ? "pointer" : "default" }}>
              <span><strong>{item.name}</strong>{n > 0 && <span style={{ color: "#D9B14B", marginLeft: 8, fontWeight: 700 }}>×{n}</span>}<br />
                <span style={{ fontSize: 12, color: "#7E96AC" }}>{item.desc}</span></span>
              <span style={{ color: ok ? "#D9B14B" : "#5E7183", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", marginLeft: 10 }}>{costStr(cost)}</span>
            </button>
          );
        })}

        {/* Production lines */}
        <h2 style={S.h2}>Military Production</h2>
        {LINES.map((line) => {
          const n = game.owned[line.id] || 0;
          const cost = costOf(line.cost, n);
          const ok = canAfford(game.res, cost);
          const frac = sim.lineStatus[line.id];
          const stalled = n > 0 && frac !== undefined && frac < 0.99;
          return (
            <button key={line.id} onClick={() => buyGen(line)} disabled={!ok}
              style={{ ...S.btnRow, background: ok ? "#2A3F58" : "#1E2F42", opacity: ok ? 1 : 0.55, cursor: ok ? "pointer" : "default", borderColor: stalled ? "#8E3B2E" : "#33506E" }}>
              <span><strong>{line.name}</strong>{n > 0 && <span style={{ color: "#D9B14B", marginLeft: 8, fontWeight: 700 }}>×{n}</span>}
                {stalled && <span style={{ color: "#C96A5A", marginLeft: 8, fontSize: 11, fontWeight: 700 }}>STALLED {Math.round(frac * 100)}%</span>}<br />
                <span style={{ fontSize: 12, color: "#7E96AC" }}>{line.rate}/s {line.outName} · eats {costStr(line.cons)}/s each</span></span>
              <span style={{ color: ok ? "#D9B14B" : "#5E7183", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", marginLeft: 10 }}>{costStr(cost)}</span>
            </button>
          );
        })}
        <div style={{ ...S.panel, fontSize: 12, color: "#9FB4C7" }}>
          Stockpile: 🔫 {fmt(game.eq.rifles)} rifles · 💥 {fmt(game.eq.artillery)} artillery · 🚜 {fmt(game.eq.tanks)} tanks · ✈️ {fmt(game.eq.fighters)} fighters · ⚓ {fmt(game.eq.ships)} warships
        </div>

        {/* Forces */}
        <h2 style={S.h2}>His Majesty's Forces</h2>
        {FORCES.map((f) => {
          const stock = { ...game.eq, manpower: game.res.manpower };
          const ok = canAfford(stock, f.cost);
          return (
            <button key={f.id} onClick={() => recruit(f)} disabled={!ok}
              style={{ ...S.btnRow, background: ok ? "#2A3F58" : "#1E2F42", opacity: ok ? 1 : 0.55, cursor: ok ? "pointer" : "default" }}>
              <span><strong>{f.icon} {f.name}</strong>{(game.forces[f.id] || 0) > 0 && <span style={{ color: "#D9B14B", marginLeft: 8, fontWeight: 700 }}>×{game.forces[f.id]}</span>}<br />
                <span style={{ fontSize: 12, color: "#7E96AC" }}>{costStr(f.cost)}{f.upkeep ? ` · upkeep ${f.upkeep}` : ""}</span></span>
              <span style={{ color: ok ? "#6FBF73" : "#5E7183", fontWeight: 700, fontSize: 12 }}>{ok ? "RECRUIT" : "—"}</span>
            </button>
          );
        })}

        {/* Theatres */}
        <h2 style={S.h2}>Theatres of War</h2>
        {THEATRES.map((t) => {
          const stage = (game.stages[t.id] || 0) + 1;
          const need = t.need(stage);
          const active = game.missions.find((m) => m.theatre === t.id);
          const ready = !active && Object.keys(need).every((k) => (game.forces[k] || 0) >= need[k]);
          const needStr = Object.entries(need).map(([k, v]) => `${v}× ${FORCES.find((f) => f.id === k).name}`).join(" + ");
          return (
            <div key={t.id} style={{ ...S.panel, borderColor: active ? "#D9B14B" : "#33506E" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{t.icon} {t.name}</strong>
                <span style={{ fontSize: 11, color: "#D9B14B" }}>{(game.stages[t.id] || 0)} victories</span>
              </div>
              <div style={{ fontSize: 12, color: "#7E96AC", margin: "4px 0" }}>{t.reward}</div>
              {active ? (
                <div>
                  <div style={{ background: "#16222E", borderRadius: 6, height: 8, overflow: "hidden", margin: "6px 0 4px" }}>
                    <div style={{ width: `${Math.min(100, 100 - ((active.endsAt - now) / (active.endsAt - (active.endsAt - t.dur * Math.pow(1.3, active.stage - 1) * (game.upgrades.radar && (t.air || t.naval) ? 0.75 : 1) * 1000))) * 100)}%`, height: "100%", background: "#D9B14B" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#D9B14B" }}>⚔️ Engaged — {Math.max(0, Math.ceil((active.endsAt - now) / 1000))}s remaining</div>
                </div>
              ) : (
                <button onClick={() => launch(t)} disabled={!ready}
                  style={{ width: "100%", padding: "9px 0", fontSize: 13, fontWeight: 700, background: ready ? "linear-gradient(180deg,#D9B14B,#B8912F)" : "#1E2F42", color: ready ? "#16222E" : "#5E7183", border: "none", borderRadius: 8, cursor: ready ? "pointer" : "default", marginTop: 4 }}>
                  {ready ? `LAUNCH OPERATION (Stage ${stage})` : `Requires ${needStr}`}
                </button>
              )}
            </div>
          );
        })}

        {/* Laws & upgrades */}
        <h2 style={S.h2}>War Cabinet · Laws & Upgrades</h2>
        {UPGRADES.filter((u) => !game.upgrades[u.id] && (!u.req || game.upgrades[u.req])).map((u) => {
          const ok = u.ws ? game.warScore >= u.ws : canAfford(game.res, u.cost);
          return (
            <button key={u.id} onClick={() => buyUpgrade(u)} disabled={!ok}
              style={{ ...S.btnRow, background: ok ? "#3A3016" : "#1E2F42", borderColor: "#D9B14B66", opacity: ok ? 1 : 0.55, cursor: ok ? "pointer" : "default" }}>
              <span><strong>{u.name}</strong><br /><span style={{ fontSize: 12, color: "#9FB4C7" }}>{u.desc}</span></span>
              <span style={{ color: "#D9B14B", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", marginLeft: 10 }}>{u.ws ? `${u.ws} ⭐` : costStr(u.cost)}</span>
            </button>
          );
        })}

        <div style={{ textAlign: "center", fontSize: 11, color: "#4E6E8E", marginTop: 16 }}>
          Autosaves every 10s · offline production at 50% (8h cap) · theatre operations complete while away
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button onClick={resetAll} style={{ background: armReset ? "#7A2E1E" : "transparent", color: armReset ? "#EDE6D3" : "#4E6E8E", border: "1px solid #33506E", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
            {armReset ? "Tap again to confirm — wipes everything" : "Reset campaign"}
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#D9B14B", color: "#16222E", fontWeight: 700, padding: "10px 18px", borderRadius: 999, fontSize: 13, boxShadow: "0 4px 14px rgba(0,0,0,0.5)", zIndex: 50, maxWidth: "90vw", textAlign: "center" }}>{toast}</div>
      )}
    </div>
  );
}
