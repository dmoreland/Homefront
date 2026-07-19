import { describe, it, expect } from "vitest";
import {
  ATTRITION_BASE, READY_SAFE_BASE, MAX_FAIL,
  trait, equipKeys, mobiliseReadiness, mobiliseCost,
  poolReadiness, committedReadiness, attritionMult, failureChance,
} from "./forces.js";

// A high-grit (quantity) nation and a low-grit (quality) one, plus the default.
const gritty = { equipFloor: 0.3, grit: 0.9 };
const picky = { equipFloor: 0.7, grit: 0.2 };
const plain = {}; // falls back to DEFAULT (0.5 / 0.5)

describe("trait", () => {
  it("falls back to defaults for a nation without traits", () => {
    const t = trait(plain);
    expect(t.equipFloor).toBe(0.5);
    expect(t.grit).toBe(0.5);
  });

  it("higher grit gives a gentler time penalty and a lower safe threshold", () => {
    expect(trait(gritty).attritionK).toBeLessThan(trait(picky).attritionK);
    expect(trait(gritty).readySafe).toBeLessThan(trait(picky).readySafe);
    expect(trait(plain).attritionK).toBe(ATTRITION_BASE * (1 - 0.6 * 0.5));
    expect(trait(plain).readySafe).toBe(READY_SAFE_BASE - 0.35 * 0.5);
  });
});

describe("equipKeys", () => {
  it("excludes manpower", () => {
    expect(equipKeys({ rifles: 10, manpower: 5 })).toEqual(["rifles"]);
  });
});

describe("mobiliseReadiness", () => {
  const cost = { rifles: 10, artillery: 4, manpower: 3 };

  it("is 1 when there are no equipment requirements", () => {
    expect(mobiliseReadiness({ manpower: 5 }, {}, plain)).toBe(1);
  });

  it("is the tightest equipment fraction, capped at 1", () => {
    // rifles: 5/10 = 0.5, artillery: 4/4 = 1 → min 0.5 (>= floor 0.5)
    expect(mobiliseReadiness(cost, { rifles: 5, artillery: 4 }, plain)).toBeCloseTo(0.5);
    // surplus everywhere still caps at 1
    expect(mobiliseReadiness(cost, { rifles: 999, artillery: 999 }, plain)).toBe(1);
  });

  it("returns null below the nation's equipment floor", () => {
    // 2/10 = 0.2 < default floor 0.5 → cannot mobilise
    expect(mobiliseReadiness(cost, { rifles: 2, artillery: 4 }, plain)).toBeNull();
    // but a gritty nation (floor 0.3) still can't at 0.2 either
    expect(mobiliseReadiness(cost, { rifles: 2, artillery: 4 }, gritty)).toBeNull();
    // a gritty nation CAN at 0.4
    expect(mobiliseReadiness(cost, { rifles: 4, artillery: 4 }, gritty)).toBeCloseTo(0.4);
  });
});

describe("mobiliseCost", () => {
  it("charges full manpower but only an r-fraction of equipment", () => {
    const out = mobiliseCost({ rifles: 10, manpower: 4 }, 0.5);
    expect(out.rifles).toBe(5);
    expect(out.manpower).toBe(4);
  });
});

describe("poolReadiness", () => {
  it("returns r for the first unit", () => {
    expect(poolReadiness(0, 1, 0.4)).toBe(0.4);
  });
  it("averages a new unit into the existing pool", () => {
    // one unit at 1.0, add one at 0.5 → (1 + 0.5) / 2 = 0.75
    expect(poolReadiness(1, 1, 0.5)).toBeCloseTo(0.75);
  });
});

describe("committedReadiness", () => {
  it("is a count-weighted average across committed force types", () => {
    const need = { inf: 3, air: 1 };
    const readiness = { inf: 0.5, air: 1 };
    // (0.5*3 + 1*1) / 4 = 0.625
    expect(committedReadiness(need, readiness)).toBeCloseTo(0.625);
  });
  it("treats missing readiness as fully ready", () => {
    expect(committedReadiness({ inf: 2 }, {})).toBe(1);
  });
});

describe("attritionMult", () => {
  it("is 1 at full readiness", () => {
    expect(attritionMult(1, plain)).toBe(1);
    expect(attritionMult(undefined, plain)).toBe(1);
  });
  it("grows as readiness falls, and gritty nations suffer less", () => {
    expect(attritionMult(0.5, plain)).toBeGreaterThan(1);
    expect(attritionMult(0.5, gritty)).toBeLessThan(attritionMult(0.5, picky));
  });
});

describe("failureChance", () => {
  it("is zero at or above the safe threshold", () => {
    expect(failureChance(1, plain)).toBe(0);
    expect(failureChance(trait(plain).readySafe, plain)).toBe(0);
  });
  it("scales up as readiness drops below safe, capped at MAX_FAIL", () => {
    const low = failureChance(0.01, picky);
    expect(low).toBeGreaterThan(0);
    expect(low).toBeLessThanOrEqual(MAX_FAIL);
    // a gritty nation tolerates the same readiness with less (or no) risk
    expect(failureChance(0.5, gritty)).toBeLessThan(failureChance(0.5, picky));
  });
});
