import { describe, it, expect } from "vitest";
import { resolveMissions } from "./missions.js";

const base = () => ({
  stages: {}, forces: {}, warScore: 0,
  missions: [],
});

describe("resolveMissions", () => {
  it("returns state unchanged when nothing has finished", () => {
    const g = { ...base(), missions: [{ theatre: "bob", stage: 1, forces: { air: 2 }, endsAt: 5000 }] };
    const { game, completed } = resolveMissions(g, 1000);
    expect(completed).toEqual([]);
    expect(game).toBe(g); // same reference, no work done
  });

  it("grants a stage, War Score, and returns committed forces on completion", () => {
    const g = { ...base(), forces: { air: 1 }, warScore: 3, warTotal: 3, missions: [{ theatre: "bob", stage: 2, forces: { air: 4 }, endsAt: 1000 }] };
    const { game, completed } = resolveMissions(g, 2000);
    expect(completed).toHaveLength(1);
    expect(game.stages.bob).toBe(1);
    expect(game.warScore).toBe(5); // 3 + stage 2
    expect(game.warTotal).toBe(5); // cumulative, drives prestige payout
    expect(game.forces.air).toBe(5); // 1 held + 4 returned
    expect(game.missions).toEqual([]);
  });

  it("accumulates warTotal independently of spent War Score", () => {
    // warScore already spent down to 0, but warTotal keeps the lifetime tally.
    const g = { ...base(), warScore: 0, warTotal: 6, missions: [{ theatre: "bob", stage: 3, forces: {}, endsAt: 1000 }] };
    const { game } = resolveMissions(g, 2000);
    expect(game.warScore).toBe(3);
    expect(game.warTotal).toBe(9);
  });

  it("resolves only finished missions and leaves ongoing ones", () => {
    const g = {
      ...base(),
      missions: [
        { theatre: "bob", stage: 1, forces: { air: 2 }, endsAt: 1000 },
        { theatre: "atlantic", stage: 1, forces: { fleet: 2 }, endsAt: 9000 },
      ],
    };
    const { game, completed } = resolveMissions(g, 2000);
    expect(completed).toHaveLength(1);
    expect(game.stages.bob).toBe(1);
    expect(game.missions).toHaveLength(1);
    expect(game.missions[0].theatre).toBe("atlantic");
  });

  it("on defeat grants no stage or score and returns only a fraction of forces", () => {
    // FAIL_LOSS = 0.5, so a 4-strong wing comes back at floor(4 * 0.5) = 2.
    const g = { ...base(), forces: { air: 1 }, warScore: 2, warTotal: 2, missions: [{ theatre: "bob", stage: 3, forces: { air: 4 }, willFail: true, endsAt: 1000 }] };
    const { game, completed } = resolveMissions(g, 2000);
    expect(completed).toHaveLength(1);
    expect(game.stages.bob).toBeUndefined(); // no stage gained
    expect(game.warScore).toBe(2); // unchanged
    expect(game.warTotal).toBe(2); // unchanged
    expect(game.forces.air).toBe(3); // 1 held + 2 survivors
    expect(game.missions).toEqual([]);
  });

  it("a victory resets that front's enemy pressure", () => {
    const g = { ...base(), pressure: { bob: 0.8 }, missions: [{ theatre: "bob", stage: 1, forces: { air: 2 }, endsAt: 1000 }] };
    const { game } = resolveMissions(g, 2000);
    expect(game.pressure.bob).toBe(0); // pushing the front back relieves pressure
  });

  it("blends returning units back at the readiness they deployed with", () => {
    // 2 units stayed home and were reinforced to 1.0 while 3 were away at 0.3.
    const g = {
      ...base(), forces: { inf: 2 }, readiness: { inf: 1 },
      missions: [{ theatre: "east", stage: 1, forces: { inf: 3 }, readiness: 0.3, forceReadiness: { inf: 0.3 }, endsAt: 1000 }],
    };
    const { game } = resolveMissions(g, 2000);
    expect(game.forces.inf).toBe(5);
    // (2*1 + 3*0.3) / 5 = 0.58 — the reinforced home units aren't dragged to 0.3,
    // and the returning under-strength units don't get free readiness.
    expect(game.readiness.inf).toBeCloseTo(0.58);
  });

  it("does not mutate the input state", () => {
    const g = { ...base(), missions: [{ theatre: "bob", stage: 1, forces: { air: 2 }, endsAt: 1000 }] };
    const snapshot = JSON.stringify(g);
    resolveMissions(g, 2000);
    expect(JSON.stringify(g)).toBe(snapshot);
  });
});
