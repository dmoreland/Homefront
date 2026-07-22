import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FRESH } from "../data/gameData.js";
import { getNation, newGame } from "../data/nations.js";
import { simulate } from "../game/simulate.js";
import { resolveMissions } from "../game/missions.js";
import { applyOffline, OFFLINE_RATE } from "../game/offline.js";
import { applyFuelPenalty, isFuelStarved, theatreDuration } from "../game/theatres.js";
import { computeMods, doctrinePoints, effectiveForceCost, effectiveNeed, totalVictory } from "../game/doctrines.js";
import { computeFocusMods, focusAvailable, mergeMods, resolveFocus } from "../game/focus.js";
import { stepPressure } from "../game/pressure.js";
import { attritionMult, committedReadiness, failureChance, mobiliseCost, mobiliseReadiness, poolReadiness } from "../game/forces.js";
import { canAfford, costOf } from "../game/economy.js";
import { saveStore } from "../game/saveStore.js";
import { fmt } from "../ui/format.js";

const TICK_MS = 250;
const TICK_DT = 0.25;
const AUTOSAVE_MS = 10000;
const FRESH_DOCTRINES = { points: 0, purchased: {} };

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

// The game engine: owns campaign state AND cross-run doctrine state, drives the
// tick/autosave/offline lifecycle, and exposes player actions. metaScreen
// selects the between-runs view (picker vs doctrine HQ) when no nation is active.
export function useGameEngine() {
  const [game, setGame] = useState(FRESH);
  const [doctrines, setDoctrines] = useState(FRESH_DOCTRINES);
  const [metaScreen, setMetaScreen] = useState("picker");
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(Date.now());
  const loadedRef = useRef(false);
  const gameRef = useRef(game);
  gameRef.current = game;

  const nation = getNation(game.nationId);
  // Effective mods = permanent doctrines (cross-run) folded with the completed
  // National Focus bonuses (this run). Recomputes as focuses complete.
  const mods = useMemo(
    () => mergeMods(computeMods(doctrines.purchased), computeFocusMods(nation, game.focus?.done)),
    [doctrines, nation, game.focus?.done],
  );
  const modsRef = useRef(mods);
  modsRef.current = mods;

  const say = useCallback((msg, ms = 3500) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }, []);

  // Derived per-second rates for the UI (gen, net, upkeep, lineStatus, convStatus).
  const sim = useMemo(() => (nation ? simulate(game, 1, nation, mods) : null), [game, nation, mods]);

  const canPrestige = nation ? totalVictory(game, nation) : false;
  const prestigeAward = doctrinePoints(game.warTotal);
  const fuelStarved = nation ? isFuelStarved(game.res, sim.net) : false;

  // Load doctrine (meta) save first, then any in-progress campaign.
  useEffect(() => {
    (async () => {
      const savedDoctrines = await saveStore.loadDoctrines();
      const doc = savedDoctrines || FRESH_DOCTRINES;
      if (savedDoctrines) setDoctrines(savedDoctrines);

      const save = await saveStore.load();
      const savedNation = save && getNation(save.nationId);
      if (savedNation) {
        let g = { ...FRESH, ...save };
        const { game: resolved, completed } = resolveMissions(g, Date.now());
        g = resolved;
        // Complete any National Focus that finished while away.
        const rf = resolveFocus(g, savedNation, Date.now());
        g = rf.game;
        if (rf.completed) say(`📋 Focus complete: ${rf.completed.name}`, 5000);
        const offMods = mergeMods(computeMods(doc.purchased), computeFocusMods(savedNation, g.focus?.done));
        const off = applyOffline(g, save.savedAt, Date.now(), savedNation, { mods: offMods });
        if (off.sim) {
          g = off.game;
          say(`🏭 The home front kept working: +${fmt(off.sim.gen.steel * off.elapsed * off.rate)} steel while you were away`, 5000);
        }
        if (completed.length) say(`🎖️ ${completed.length} theatre victor${completed.length > 1 ? "ies" : "y"} while you were away!`, 5000);
        // Enemy pressure while away — at most one offensive per front (offline-safe).
        const sp = stepPressure(g, savedNation, off.elapsed || 0);
        g = sp.game;
        if (sp.events.length) say(`💥 ${sp.events.length} enemy offensive${sp.events.length > 1 ? "s" : ""} struck your fronts while you were away`, 6000);
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
        if (!n) return g; // between runs — nothing to simulate
        const r = simulate(g, TICK_DT, n, modsRef.current);
        const advanced = { ...g, res: r.res, eq: r.eq, readiness: r.readiness };
        // F15: oil deficit slows active air/naval operations.
        advanced.missions = applyFuelPenalty(advanced.missions, n, isFuelStarved(r.res, r.net), TICK_DT);
        const { game: withMissions, completed } = resolveMissions(advanced, Date.now());
        for (const m of completed) {
          const t = n.theatres.find((t) => t.id === m.theatre);
          const name = t ? t.name : "the field";
          if (m.willFail) setTimeout(() => say(`💥 Defeat in ${name} — under-equipped forces broke and took losses`, 5000), 0);
          else setTimeout(() => say(`🎖️ Victory in the ${name}! +${m.stage} War Score`), 0);
        }
        // Complete the active National Focus if its timer has elapsed.
        const { game: afterFocus, completed: focusDone } = resolveFocus(withMissions, n, Date.now());
        if (focusDone) setTimeout(() => say(`📋 Focus complete: ${focusDone.name}`), 0);
        // Enemy pressure builds on engaged fronts; resolve offensives that land.
        const { game: next, events } = stepPressure(afterFocus, n, TICK_DT);
        for (const e of events) {
          const t = n.theatres.find((t) => t.id === e.theatre);
          const name = t ? t.name : "the front";
          const msg = e.outcome === "repelled" ? `🛡️ Enemy offensive in ${name} repelled by the garrison`
            : e.outcome === "contained" ? `💥 Enemy offensive in ${name} — supplies raided, garrison mauled`
            : `☠️ ${name} overrun — ground lost and stores raided`;
          setTimeout(() => say(msg, 5000), 0);
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

  // ---------- Campaign actions ----------
  const selectNation = useCallback((id) => {
    const n = getNation(id);
    if (!n) return;
    const g = newGame(n);
    const res = { ...g.res };
    for (const r in modsRef.current.startBonus) res[r] = (res[r] || 0) + modsRef.current.startBonus[r];
    setGame({ ...g, res });
    setMetaScreen("picker");
  }, []);

  const tap = useCallback(() => setGame((g) => {
    const n = getNation(g.nationId);
    if (!n) return g;
    // Tap strength comes from mods.tapMult (War Footing focus + any tap doctrine).
    const yielded = (n.tapBase || 2) * modsRef.current.tapMult;
    return { ...g, res: { ...g.res, steel: g.res.steel + yielded }, taps: g.taps + 1 };
  }), []);

  // Begin a National Focus — one at a time, prerequisites met. It completes on a
  // timer (resolveFocus in the tick/load) and applies its bonus for the run.
  const startFocus = useCallback((f) => setGame((g) => {
    const n = getNation(g.nationId);
    if (!n) return g;
    if (!focusAvailable(f, g.focus)) return g;
    return { ...g, focus: { ...g.focus, active: { id: f.id, endsAt: Date.now() + f.time * 1000 } } };
  }), []);

  const buyGen = useCallback((item) => setGame((g) => {
    const cost = costOf(item.cost, g.owned[item.id] || 0);
    if (!canAfford(g.res, cost)) return g;
    return { ...pay(g, cost), owned: { ...g.owned, [item.id]: (g.owned[item.id] || 0) + 1 } };
  }), []);

  // Recruit a fully-equipped division/wing/fleet (readiness 1.0).
  const recruit = useCallback((f) => setGame((g) => {
    const cost = effectiveForceCost(f, modsRef.current);
    const stock = { ...g.eq, manpower: g.res.manpower };
    if (!canAfford(stock, cost)) return g;
    return {
      ...pay(g, cost),
      forces: { ...g.forces, [f.id]: (g.forces[f.id] || 0) + 1 },
      readiness: { ...g.readiness, [f.id]: poolReadiness(g.forces[f.id] || 0, g.readiness[f.id] ?? 1, 1) },
    };
  }), []);

  // Mobilise a unit with whatever equipment is on hand — full manpower, only an
  // r-fraction of each equipment (any readiness, even 0%). Needs only manpower;
  // reinforcement tops the unit up over time as equipment allows.
  const mobilise = useCallback((f) => setGame((g) => {
    const n = getNation(g.nationId);
    if (!n) return g;
    const cost = effectiveForceCost(f, modsRef.current);
    const r = mobiliseReadiness(cost, g.eq);
    const spend = mobiliseCost(cost, r);
    if (g.res.manpower < (spend.manpower || 0)) return g;
    return {
      ...pay(g, spend),
      forces: { ...g.forces, [f.id]: (g.forces[f.id] || 0) + 1 },
      readiness: { ...g.readiness, [f.id]: poolReadiness(g.forces[f.id] || 0, g.readiness[f.id] ?? 1, r) },
    };
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
    const need = effectiveNeed(t, stage, modsRef.current);
    for (const k in need) if ((g.forces[k] || 0) < need[k]) return g;
    const forces = { ...g.forces };
    for (const k in need) forces[k] -= need[k];
    // Readiness of the committed forces drives attrition (slower ops) and, below
    // the nation's safe threshold, a one-time defeat roll baked in at launch. The
    // per-force readiness is kept so survivors blend back correctly on return.
    const forceReadiness = {};
    for (const k in need) forceReadiness[k] = g.readiness[k] ?? 1;
    const readiness = committedReadiness(need, g.readiness);
    const dur = theatreDuration(t, stage, n, g.upgrades, modsRef.current) * attritionMult(readiness, n);
    const willFail = Math.random() < failureChance(readiness, n);
    return { ...g, forces, missions: [...g.missions, { theatre: t.id, stage, forces: need, readiness, forceReadiness, willFail, endsAt: Date.now() + dur * 1000 }] };
  }), []);

  // Station one idle unit of a force type to defend a front (slows its pressure
  // and mans the garrison when an offensive lands). Moves it out of the free pool.
  const garrison = useCallback((theatreId, fid) => setGame((g) => {
    if ((g.forces[fid] || 0) < 1) return g;
    const gr = g.garrison[theatreId] || {};
    return {
      ...g,
      forces: { ...g.forces, [fid]: g.forces[fid] - 1 },
      garrison: { ...g.garrison, [theatreId]: { ...gr, [fid]: (gr[fid] || 0) + 1 } },
    };
  }), []);

  // Pull one garrisoned unit back into the free pool (available to attack again).
  const withdraw = useCallback((theatreId, fid) => setGame((g) => {
    const gr = g.garrison[theatreId] || {};
    if ((gr[fid] || 0) < 1) return g;
    return {
      ...g,
      forces: { ...g.forces, [fid]: (g.forces[fid] || 0) + 1 },
      garrison: { ...g.garrison, [theatreId]: { ...gr, [fid]: gr[fid] - 1 } },
    };
  }), []);

  const reset = useCallback(async () => {
    await saveStore.clear();
    setGame(FRESH); // back to the nation picker (doctrines are kept)
    setMetaScreen("picker");
    say("🗺️ Choose a nation to begin a new campaign");
  }, [say]);

  // ---------- Prestige & doctrines ----------
  const prestige = useCallback(() => {
    const g = gameRef.current;
    const n = getNation(g.nationId);
    if (!n || !totalVictory(g, n)) return;
    const award = doctrinePoints(g.warTotal);
    setDoctrines((d) => {
      const next = { points: d.points + award, purchased: d.purchased };
      saveStore.saveDoctrines(next);
      return next;
    });
    saveStore.clear();
    setGame(FRESH);
    setMetaScreen("hq");
    say(`🏅 Total Victory! Prestiged for +${award} doctrine points`, 5000);
  }, [say]);

  const buyDoctrine = useCallback((node) => setDoctrines((d) => {
    if (d.purchased[node.id]) return d;
    if (node.req && !d.purchased[node.req]) return d;
    if (d.points < node.cost) return d;
    const next = { points: d.points - node.cost, purchased: { ...d.purchased, [node.id]: true } };
    saveStore.saveDoctrines(next);
    return next;
  }), []);

  const openDoctrines = useCallback(() => setMetaScreen("hq"), []);
  const closeDoctrines = useCallback(() => setMetaScreen("picker"), []);

  return {
    game, nation, sim, now, toast, mods, doctrines, metaScreen, canPrestige, prestigeAward, fuelStarved,
    actions: { selectNation, tap, buyGen, recruit, mobilise, buyUpgrade, launch, garrison, withdraw, startFocus, reset, prestige, buyDoctrine, openDoctrines, closeDoctrines },
  };
}
