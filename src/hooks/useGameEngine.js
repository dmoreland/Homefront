import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FRESH, THEATRES } from "../data/gameData.js";
import { simulate } from "../game/simulate.js";
import { resolveMissions } from "../game/missions.js";
import { applyOffline, OFFLINE_RATE } from "../game/offline.js";
import { canAfford, costOf } from "../game/economy.js";
import { saveStore } from "../game/saveStore.js";
import { fmt } from "../ui/format.js";

const TICK_MS = 250;
const TICK_DT = 0.25;
const AUTOSAVE_MS = 10000;

// Pay a cost out of a game state, drawing from resources or equipment as
// appropriate for each key. Pure helper.
function pay(g, cost) {
  const res = { ...g.res }, eq = { ...g.eq };
  for (const k in cost) {
    if (k in res) res[k] -= cost[k];
    else eq[k] -= cost[k];
  }
  return { ...g, res, eq };
}

// The game engine: owns state, drives the tick/autosave/offline lifecycle,
// and exposes the player actions. Keeps all impure concerns (timers, storage,
// toasts) here so simulate()/resolveMissions()/etc. stay pure and testable.
export function useGameEngine() {
  const [game, setGame] = useState(FRESH);
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(Date.now());
  const loadedRef = useRef(false);
  const gameRef = useRef(game);
  gameRef.current = game;

  const say = useCallback((msg, ms = 3500) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }, []);

  // Derived per-second rates for the UI (gen, net, upkeep, lineStatus).
  const sim = useMemo(() => simulate(game, 1), [game]);

  // Load save + resolve anything that happened while away (missions, offline production).
  useEffect(() => {
    (async () => {
      const save = await saveStore.load();
      if (save) {
        let g = { ...FRESH, ...save };
        const { game: resolved, completed } = resolveMissions(g, Date.now());
        g = resolved;
        const off = applyOffline(g, save.savedAt, Date.now());
        if (off.sim) {
          g = off.game;
          say(`🏭 The home front kept working: +${fmt(off.sim.gen.steel * off.elapsed * OFFLINE_RATE)} steel while you were away`, 5000);
        }
        if (completed.length) say(`🎖️ ${completed.length} theatre victor${completed.length > 1 ? "ies" : "y"} while you were away!`, 5000);
        setGame(g);
      }
      loadedRef.current = true;
    })();
  }, [say]);

  // Live tick — advance the simulation and resolve missions as they finish.
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      setGame((g) => {
        const r = simulate(g, TICK_DT);
        const advanced = { ...g, res: r.res, eq: r.eq };
        const { game: next, completed } = resolveMissions(advanced, Date.now());
        for (const m of completed) {
          const t = THEATRES.find((t) => t.id === m.theatre);
          setTimeout(() => say(`🎖️ Victory in the ${t.name}! +${m.stage} War Score`), 0);
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [say]);

  // Autosave on an interval and when the tab is hidden.
  useEffect(() => {
    const id = setInterval(() => {
      if (loadedRef.current) saveStore.save({ ...gameRef.current, savedAt: Date.now() });
    }, AUTOSAVE_MS);
    const onHide = () => {
      if (loadedRef.current && document.visibilityState === "hidden")
        saveStore.save({ ...gameRef.current, savedAt: Date.now() });
    };
    document.addEventListener("visibilitychange", onHide);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onHide); };
  }, []);

  // ---------- Actions ----------
  const tap = useCallback(() => setGame((g) => ({
    ...g,
    res: { ...g.res, steel: g.res.steel + (g.upgrades.shift ? 6 : 2) },
    taps: g.taps + 1,
  })), []);

  const buyGen = useCallback((item) => setGame((g) => {
    const cost = costOf(item.cost, g.owned[item.id] || 0);
    if (!canAfford(g.res, cost)) return g;
    return { ...pay(g, cost), owned: { ...g.owned, [item.id]: (g.owned[item.id] || 0) + 1 } };
  }), []);

  const recruit = useCallback((f) => setGame((g) => {
    const stock = { ...g.eq, manpower: g.res.manpower };
    if (!canAfford(stock, f.cost)) return g;
    return { ...pay(g, f.cost), forces: { ...g.forces, [f.id]: (g.forces[f.id] || 0) + 1 } };
  }), []);

  const buyUpgrade = useCallback((u) => setGame((g) => {
    if (g.upgrades[u.id]) return g;
    if (u.req && !g.upgrades[u.req]) return g;
    if (u.ws) {
      if (g.warScore < u.ws) return g;
      return { ...g, warScore: g.warScore - u.ws, upgrades: { ...g.upgrades, [u.id]: true } };
    }
    if (!canAfford(g.res, u.cost)) return g;
    return { ...pay(g, u.cost), upgrades: { ...g.upgrades, [u.id]: true } };
  }), []);

  const launch = useCallback((t) => setGame((g) => {
    if (g.missions.some((m) => m.theatre === t.id)) return g;
    const stage = (g.stages[t.id] || 0) + 1;
    const need = t.need(stage);
    for (const k in need) if ((g.forces[k] || 0) < need[k]) return g;
    const forces = { ...g.forces };
    for (const k in need) forces[k] -= need[k];
    let dur = t.dur * Math.pow(1.3, stage - 1);
    if (g.upgrades.radar && (t.air || t.naval)) dur *= 0.75;
    return { ...g, forces, missions: [...g.missions, { theatre: t.id, stage, forces: need, endsAt: Date.now() + dur * 1000 }] };
  }), []);

  const reset = useCallback(async () => {
    await saveStore.clear();
    setGame(FRESH);
    say("🇬🇧 A fresh mobilisation begins");
  }, [say]);

  return { game, sim, now, toast, actions: { tap, buyGen, recruit, buyUpgrade, launch, reset } };
}
