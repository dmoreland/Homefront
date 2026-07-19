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

  it("does not mutate the input state", () => {
    const g = { ...base(), missions: [{ theatre: "bob", stage: 1, forces: { air: 2 }, endsAt: 1000 }] };
    const snapshot = JSON.stringify(g);
    resolveMissions(g, 2000);
    expect(JSON.stringify(g)).toBe(snapshot);
  });
});
