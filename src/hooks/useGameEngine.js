import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FRESH } from "../data/gameData.js";
import { getNation, newGame } from "../data/nations.js";
import { simulate } from "../game/simulate.js";
import { resolveMissions } from "../game/missions.js";
import { applyOffline, OFFLINE_RATE } from "../game/offline.js";
import { theatreDuration } from "../game/theatres.js";
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
// and exposes player actions. When no nation is selected (nationId null) the
// app shows the picker; selectNation starts a campaign. Keeps all impure
// concerns (timers, storage, toasts) here so the game modules stay pure.
export function useGameEngine() {
  const [game, setGame] = useState(FRESH);
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(Date.now());
  const loadedRef = useRef(false);
  const gameRef = useRef(game);
  gameRef.current = game;

  const nation = getNation(game.nationId);

  const say = useCallback((msg, ms = 3500) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }, []);

  // Derived per-second rates for the UI (gen, net, upkeep, lineStatus, convStatus).
  const sim = useMemo(() => (nation ? simulate(game, 1, nation) : null), [game, nation]);

  // Load save + resolve anything that happened while away (missions, offline production).
  useEffect(() => {
    (async () => {
      const save = await saveStore.load();
      const savedNation = save && getNation(save.nationId);
      if (savedNation) {
        let g = { ...FRESH, ...save };
        const { game: resolved, completed } = resolveMissions(g, Date.now());
        g = resolved;
        const off = applyOffline(g, save.savedAt, Date.now(), savedNation);
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
        const n = getNation(g.nationId);
        if (!n) return g; // picker showing — nothing to simulate
        const r = simulate(g, TICK_DT, n);
        const advanced = { ...g, res: r.res, eq: r.eq };
        const { game: next, completed } = resolveMissions(advanced, Date.now());
        for (const m of completed) {
          const t = n.theatres.find((t) => t.id === m.theatre);
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
      if (loadedRef.current && gameRef.current.nationId) saveStore.save({ ...gameRef.current, savedAt: Date.now() });
    }, AUTOSAVE_MS);
    const onHide = () => {
      if (loadedRef.current && gameRef.current.nationId && document.visibilityState === "hidden")
        saveStore.save({ ...gameRef.current, savedAt: Date.now() });
    };
    document.addEventListener("visibilitychange", onHide);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onHide); };
  }, []);

  // ---------- Actions ----------
  const selectNation = useCallback((id) => {
    const n = getNation(id);
    if (n) setGame(newGame(n));
  }, []);

  const tap = useCallback(() => setGame((g) => {
    const n = getNation(g.nationId);
    if (!n) return g;
    const shift = n.upgrades.find((u) => u.tapMult && g.upgrades[u.id]);
    const yielded = (n.tapBase || 2) * (shift ? shift.tapMult : 1);
    return { ...g, res: { ...g.res, steel: g.res.steel + yielded }, taps: g.taps + 1 };
  }), []);

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
    const n = getNation(g.nationId);
    if (!n) return g;
    if (g.missions.some((m) => m.theatre === t.id)) return g;
    const stage = (g.stages[t.id] || 0) + 1;
    const need = t.need(stage);
    for (const k in need) if ((g.forces[k] || 0) < need[k]) return g;
    const forces = { ...g.forces };
    for (const k in need) forces[k] -= need[k];
    const dur = theatreDuration(t, stage, n, g.upgrades);
    return { ...g, forces, missions: [...g.missions, { theatre: t.id, stage, forces: need, endsAt: Date.now() + dur * 1000 }] };
  }), []);

  const reset = useCallback(async () => {
    await saveStore.clear();
    setGame(FRESH); // back to the nation picker
    say("🗺️ Choose a nation to begin a new campaign");
  }, [say]);

  return { game, nation, sim, now, toast, actions: { selectNation, tap, buyGen, recruit, buyUpgrade, launch, reset } };
}
