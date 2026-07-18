import { describe, it, expect } from "vitest";
import { runNation } from "./balance.mjs";
import { NATIONS } from "../src/data/nations.js";

// Balance regression guard: every nation must stay winnable, and a greedy
// player should reach first prestige roughly within the PRD's target window.
// This catches config changes that make a nation unbeatable or absurdly slow.
describe("balance simulator", () => {
  for (const nation of NATIONS) {
    it(`${nation.name} reaches Total Victory in a sensible time`, () => {
      const res = runNation(nation);
      expect(res.milestones.PRESTIGE, "should reach Total Victory").not.toBeUndefined();
      expect(res.milestones.PRESTIGE).toBeLessThan(90 * 60); // generous upper bound (min)
      expect(res.points).toBeGreaterThan(0);
    }, 30000);
  }
});
