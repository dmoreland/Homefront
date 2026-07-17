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
    const g = { ...base(), forces: { air: 1 }, warScore: 3, missions: [{ theatre: "bob", stage: 2, forces: { air: 4 }, endsAt: 1000 }] };
    const { game, completed } = resolveMissions(g, 2000);
    expect(completed).toHaveLength(1);
    expect(game.stages.bob).toBe(1);
    expect(game.warScore).toBe(5); // 3 + stage 2
    expect(game.forces.air).toBe(5); // 1 held + 4 returned
    expect(game.missions).toEqual([]);
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

  it("does not mutate the input state", () => {
    const g = { ...base(), missions: [{ theatre: "bob", stage: 1, forces: { air: 2 }, endsAt: 1000 }] };
    const snapshot = JSON.stringify(g);
    resolveMissions(g, 2000);
    expect(JSON.stringify(g)).toBe(snapshot);
  });
});
