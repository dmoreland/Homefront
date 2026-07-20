import { describe, it, expect } from "vitest";
import { computeMods } from "./doctrines.js";
import { computeFocusMods, mergeMods, focusAvailable, resolveFocus, identityMods } from "./focus.js";

// A tiny nation with a spine + identity focuses covering every effect kind.
const nation = {
  id: "test",
  focuses: [
    { id: "war_footing", name: "War Footing", time: 45, effect: { kind: "tapMult", mult: 3 } },
    { id: "steel1", name: "Steel Drive", time: 90, req: "war_footing", effect: { kind: "genMult", res: "steel", mult: 1.25 } },
    { id: "all_out", name: "Total War", time: 120, req: "steel1", effect: { kind: "genMult", res: "all", mult: 1.1 } },
    { id: "wave", name: "Human Wave", time: 60, req: "war_footing", effect: { kind: "manpowerMult", mult: 2 } },
    { id: "seize", name: "Strike South", time: 60, req: "war_footing", effect: { kind: "flatGen", res: { oil: 0.5, rubber: 0.3 } } },
    { id: "reward", name: "Wolfpack", time: 60, req: "steel1", effect: { kind: "theatreReward", mult: 1.3 } },
    { id: "grantsteel", name: "Lend-Lease", time: 60, req: "war_footing", effect: { kind: "grant", res: { steel: 800 } } },
  ],
};

describe("computeFocusMods", () => {
  it("returns the identity bundle when nothing is done", () => {
    expect(computeFocusMods(nation, {})).toEqual(identityMods());
  });

  it("aggregates completed focuses across every dim", () => {
    const done = { war_footing: true, steel1: true, all_out: true, wave: true, seize: true, reward: true };
    const m = computeFocusMods(nation, done);
    expect(m.tapMult).toBeCloseTo(3);
    expect(m.genMult.steel).toBeCloseTo(1.25 * 1.1); // steel1 × all_out
    expect(m.genMult.alu).toBeCloseTo(1.1); // all_out only
    expect(m.manpowerMult).toBeCloseTo(2);
    expect(m.flatGen.oil).toBeCloseTo(0.5);
    expect(m.flatGen.rubber).toBeCloseTo(0.3);
    expect(m.theatreRewardMult).toBeCloseTo(1.3);
  });

  it("ignores a `grant` focus (it's a completion-time effect, not a mod)", () => {
    expect(computeFocusMods(nation, { grantsteel: true })).toEqual(identityMods());
  });
});

describe("mergeMods", () => {
  it("multiplies multiplicative dims and sums flat/additive ones", () => {
    const a = { ...identityMods(), genMult: { ...identityMods().genMult, steel: 1.2 }, stageReqDelta: -1, flatGen: { oil: 0.5 } };
    const b = { ...identityMods(), genMult: { ...identityMods().genMult, steel: 1.5 }, stageReqDelta: -1, flatGen: { oil: 0.2, rubber: 0.4 } };
    const m = mergeMods(a, b);
    expect(m.genMult.steel).toBeCloseTo(1.2 * 1.5);
    expect(m.stageReqDelta).toBe(-2);
    expect(m.flatGen.oil).toBeCloseTo(0.7);
    expect(m.flatGen.rubber).toBeCloseTo(0.4);
  });

  it("folds doctrine mods and focus mods into one bundle", () => {
    const doc = computeMods({}); // identity
    const foc = computeFocusMods(nation, { war_footing: true, steel1: true });
    const m = mergeMods(doc, foc);
    expect(m.tapMult).toBeCloseTo(3);
    expect(m.genMult.steel).toBeCloseTo(1.25);
  });
});

describe("focusAvailable", () => {
  it("is true only when prereqs are done and nothing is active", () => {
    const f = nation.focuses.find((x) => x.id === "steel1");
    expect(focusAvailable(f, { active: null, done: {} })).toBe(false); // war_footing not done
    expect(focusAvailable(f, { active: null, done: { war_footing: true } })).toBe(true);
    expect(focusAvailable(f, { active: { id: "wave" }, done: { war_footing: true } })).toBe(false); // one already running
  });

  it("treats a no-prereq focus as available when idle", () => {
    const f = nation.focuses.find((x) => x.id === "war_footing");
    expect(focusAvailable(f, { active: null, done: {} })).toBe(true);
  });
});

describe("resolveFocus", () => {
  const base = () => ({ res: { steel: 100 }, focus: { active: { id: "war_footing", endsAt: 1000 }, done: {} } });

  it("does nothing while the timer is still running", () => {
    const g = base();
    const { game, completed } = resolveFocus(g, nation, 500);
    expect(completed).toBeNull();
    expect(game).toBe(g);
  });

  it("marks the focus done and clears the active slot when the timer elapses", () => {
    const { game, completed } = resolveFocus(base(), nation, 2000);
    expect(completed.id).toBe("war_footing");
    expect(game.focus.done.war_footing).toBe(true);
    expect(game.focus.active).toBeNull();
  });

  it("applies a one-time `grant` to resources on completion", () => {
    const g = { res: { steel: 100 }, focus: { active: { id: "grantsteel", endsAt: 1000 }, done: {} } };
    const { game, completed } = resolveFocus(g, nation, 2000);
    expect(completed.id).toBe("grantsteel");
    expect(game.res.steel).toBe(900); // 100 + 800 grant
  });

  it("is a no-op when no focus is active", () => {
    const g = { res: {}, focus: { active: null, done: {} } };
    expect(resolveFocus(g, nation, 9999).completed).toBeNull();
  });
});
