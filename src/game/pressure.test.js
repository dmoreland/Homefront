import { describe, it, expect } from "vitest";
import {
  defenseStrength, assaultStrength, pressureRate, offensiveOutcome, stepPressure,
  ASSAULT_BASE, PRESSURE_RESET, OVERRUN_LOSS, RAID_RES_FRAC,
} from "./pressure.js";

// Two theatres; only "east" starts engaged (a stage won).
const nation = {
  grit: 0.5,
  theatres: [
    { id: "east", name: "Eastern Front" },
    { id: "west", name: "West" },
  ],
};

describe("defenseStrength", () => {
  it("sums garrison counts weighted by readiness and grit", () => {
    // (2 inf @1.0 + 1 arm @0.5) = 2.5, × grit factor (0.7 + 0.6*0.5 = 1.0)
    expect(defenseStrength({ inf: 2, arm: 1 }, { inf: 1, arm: 0.5 }, nation)).toBeCloseTo(2.5);
  });
  it("is 0 for an empty garrison", () => {
    expect(defenseStrength(undefined, {}, nation)).toBe(0);
  });
  it("high grit holds better with the same numbers", () => {
    const g = { inf: 3 };
    expect(defenseStrength(g, { inf: 1 }, { grit: 0.9 })).toBeGreaterThan(defenseStrength(g, { inf: 1 }, { grit: 0.1 }));
  });
});

describe("assaultStrength", () => {
  it("scales with the stage (min 1)", () => {
    expect(assaultStrength(0)).toBe(ASSAULT_BASE);
    expect(assaultStrength(3)).toBe(ASSAULT_BASE * 3);
  });
});

describe("pressureRate", () => {
  it("rises with stage and falls with garrison", () => {
    expect(pressureRate(3, 0)).toBeGreaterThan(pressureRate(1, 0));
    expect(pressureRate(3, 5)).toBeLessThan(pressureRate(3, 0));
  });
});

describe("offensiveOutcome", () => {
  it("is repelled / contained / overrun by the defense:assault ratio", () => {
    expect(offensiveOutcome(10, 5)).toBe("repelled"); // ratio 2
    expect(offensiveOutcome(3, 5)).toBe("contained"); // ratio 0.6
    expect(offensiveOutcome(1, 5)).toBe("overrun"); // ratio 0.2
    expect(offensiveOutcome(0, 5)).toBe("overrun"); // undefended
  });
});

describe("stepPressure", () => {
  const base = () => ({
    res: { steel: 100, oil: 50 }, stages: { east: 2 }, readiness: { inf: 1 },
    garrison: {}, pressure: { east: 0 },
  });

  it("only accrues pressure on engaged fronts (stages>=1)", () => {
    const { game } = stepPressure(base(), nation, 1);
    expect(game.pressure.east).toBeGreaterThan(0);
    expect(game.pressure.west).toBeUndefined(); // never engaged
  });

  it("does not mutate the input", () => {
    const g = base();
    const snap = JSON.stringify(g);
    stepPressure(g, nation, 1);
    expect(JSON.stringify(g)).toBe(snap);
  });

  it("an undefended front is overrun: loses a stage, is raided, pressure resets", () => {
    const g = { ...base(), pressure: { east: 0.999 } }; // about to max, no garrison
    const { game, events } = stepPressure(g, nation, 1);
    expect(events).toEqual([{ theatre: "east", outcome: "overrun" }]);
    expect(game.stages.east).toBe(1); // 2 - 1
    expect(game.res.steel).toBeCloseTo(100 * (1 - RAID_RES_FRAC)); // raided
    expect(game.pressure.east).toBeCloseTo(PRESSURE_RESET);
  });

  it("a strong garrison repels the assault: no stage/resource loss, light garrison losses", () => {
    // east stage 2 → assault 2.4; garrison 5 inf @1.0 → defense 5 ≥ assault → repelled.
    const g = { ...base(), pressure: { east: 0.999 }, garrison: { east: { inf: 5 } } };
    const { game, events } = stepPressure(g, nation, 1);
    expect(events[0].outcome).toBe("repelled");
    expect(game.stages.east).toBe(2); // held
    expect(game.res.steel).toBe(100); // not raided
    expect(game.garrison.east.inf).toBeLessThan(5); // took some casualties
    expect(game.garrison.east.inf).toBeGreaterThan(0);
  });

  it("a partial garrison contains the assault: front held, but no stage and mauled", () => {
    // defense between 0.5× and 1× assault → contained: stage kept, garrison mauled, no raid.
    const g = { ...base(), pressure: { east: 0.999 }, garrison: { east: { inf: 2 } } }; // 2 vs 2.4
    const { game, events } = stepPressure(g, nation, 1);
    expect(events[0].outcome).toBe("contained");
    expect(game.stages.east).toBe(2); // held
    expect(game.res.steel).toBe(100); // not raided
    expect(game.garrison.east.inf).toBeLessThan(2); // mauled
  });

  it("resolves at most one offensive per front per call (offline-safe)", () => {
    // A huge dt would cross the threshold many times, but only one offensive resolves.
    const g = { ...base(), stages: { east: 3 }, pressure: { east: 0 } };
    const { game, events } = stepPressure(g, nation, 100000);
    expect(events.length).toBe(1);
    expect(game.pressure.east).toBeCloseTo(PRESSURE_RESET);
  });
});
