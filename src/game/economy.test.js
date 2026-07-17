import { describe, it, expect } from "vitest";
import { costOf, canAfford } from "./economy.js";

describe("costOf", () => {
  it("returns base cost when nothing owned", () => {
    expect(costOf({ steel: 20 }, 0)).toEqual({ steel: 20 });
  });

  it("scales each resource by 1.15^owned and rounds up", () => {
    // 20 * 1.15 = 23, 20 * 1.15^2 = 26.45 -> 27
    expect(costOf({ steel: 20 }, 1)).toEqual({ steel: 23 });
    expect(costOf({ steel: 20 }, 2)).toEqual({ steel: 27 });
  });

  it("scales multi-resource costs independently", () => {
    expect(costOf({ steel: 120, oil: 20 }, 1)).toEqual({ steel: 138, oil: 23 });
  });
});

describe("canAfford", () => {
  it("is true when stock meets every cost key", () => {
    expect(canAfford({ steel: 100, oil: 5 }, { steel: 20, oil: 5 })).toBe(true);
  });

  it("is false when any key is short", () => {
    expect(canAfford({ steel: 100, oil: 4 }, { steel: 20, oil: 5 })).toBe(false);
  });

  it("treats a missing stock key as zero", () => {
    expect(canAfford({ steel: 100 }, { rubber: 1 })).toBe(false);
  });
});
