import { describe, it, expect } from "vitest";
import {
  ATTRITION_BASE, READY_SAFE_BASE, MAX_FAIL,
  trait, equipKeys, mobiliseReadiness, mobiliseCost,
  poolReadiness, mergeReadiness, committedReadiness, attritionMult, failureChance, reinforce,
} from "./forces.js";

// A high-grit (quantity) nation and a low-grit (quality) one, plus the default.
const gritty = { grit: 0.9 };
const picky = { grit: 0.2 };
const plain = {}; // falls back to DEFAULT grit 0.5

describe("trait", () => {
  it("falls back to the default grit for a nation without traits", () => {
    expect(trait(plain).grit).toBe(0.5);
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
    expect(mobiliseReadiness({ manpower: 5 }, {})).toBe(1);
  });

  it("is the tightest equipment fraction, capped at 1", () => {
    // rifles: 5/10 = 0.5, artillery: 4/4 = 1 → min 0.5
    expect(mobiliseReadiness(cost, { rifles: 5, artillery: 4 })).toBeCloseTo(0.5);
    // surplus everywhere still caps at 1
    expect(mobiliseReadiness(cost, { rifles: 999, artillery: 999 })).toBe(1);
  });

  it("allows any readiness down to 0 — no equipment floor", () => {
    // barely any equipment → very low readiness, still a real number (not null)
    expect(mobiliseReadiness(cost, { rifles: 2, artillery: 4 })).toBeCloseTo(0.2);
    // nothing on hand → 0% readiness, still mobilisable (caller checks manpower)
    expect(mobiliseReadiness(cost, {})).toBe(0);
  });
});

describe("mobiliseCost", () => {
  it("charges full manpower but only an r-fraction of equipment", () => {
    const out = mobiliseCost({ rifles: 10, manpower: 4 }, 0.5);
    expect(out.rifles).toBe(5);
    expect(out.manpower).toBe(4);
  });
});

describe("mergeReadiness", () => {
  it("is a count-weighted average of two groups", () => {
    // 2 units at 1.0 + 3 units at 0.3 → (2 + 0.9) / 5 = 0.58
    expect(mergeReadiness(2, 1, 3, 0.3)).toBeCloseTo(0.58);
  });
  it("is 1 for an empty merge", () => {
    expect(mergeReadiness(0, 1, 0, 1)).toBe(1);
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

describe("reinforce", () => {
  // Minimal nation: infantry uses rifles+artillery, panzer uses tanks+artillery
  // (artillery is shared, so config order decides who gets it first).
  const nation = {
    forces: [
      { id: "inf", cost: { rifles: 10, artillery: 4, manpower: 80 } },
      { id: "arm", cost: { tanks: 5, artillery: 2, manpower: 40 } },
    ],
  };

  it("lifts an under-strength pool toward full and consumes the equipment", () => {
    // 2 infantry at 0.5 need 2*(0.5)*10 = 10 rifles and 2*(0.5)*4 = 4 artillery to reach full.
    const { eq, readiness } = reinforce({ inf: 2 }, { inf: 0.5 }, { rifles: 10, artillery: 4 }, nation);
    expect(readiness.inf).toBeCloseTo(1);
    expect(eq.rifles).toBeCloseTo(0);
    expect(eq.artillery).toBeCloseTo(0);
  });

  it("is bottlenecked by the tightest equipment", () => {
    // Plenty of rifles but only 2 artillery: 2 inf can rise by 2/(2*4)=0.25 → 0.75.
    const { eq, readiness } = reinforce({ inf: 2 }, { inf: 0.5 }, { rifles: 999, artillery: 2 }, nation);
    expect(readiness.inf).toBeCloseTo(0.75);
    expect(eq.artillery).toBeCloseTo(0);
    expect(eq.rifles).toBeCloseTo(999 - 2 * 0.25 * 10); // 994
  });

  it("fills earlier forces first when equipment is shared", () => {
    // Only 4 artillery. Infantry (first) needs 4 to reach full and takes it all;
    // the panzer pool is left starved of artillery.
    const { eq, readiness } = reinforce(
      { inf: 2, arm: 1 }, { inf: 0.5, arm: 0.5 },
      { rifles: 999, artillery: 4, tanks: 999 }, nation,
    );
    expect(readiness.inf).toBeCloseTo(1);
    expect(readiness.arm).toBeCloseTo(0.5); // no artillery left
    expect(eq.artillery).toBeCloseTo(0);
  });

  it("returns the inputs unchanged when nothing is under strength", () => {
    const eqIn = { rifles: 50 };
    const rIn = { inf: 1 };
    const out = reinforce({ inf: 3 }, rIn, eqIn, nation);
    expect(out.eq).toBe(eqIn);
    expect(out.readiness).toBe(rIn);
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
