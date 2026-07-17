import { describe, it, expect } from "vitest";
import { computeMods, doctrinePoints, totalVictory, effectiveForceCost, effectiveNeed } from "./doctrines.js";
import { getNation } from "../data/nations.js";

const DE = getNation("germany");

describe("computeMods", () => {
  it("returns identity when nothing is purchased", () => {
    const m = computeMods({});
    expect(m.genMult.steel).toBe(1);
    expect(m.forceCostMult.inf).toBe(1);
    expect(m.stageReqDelta).toBe(0);
    expect(m.opSpeedMult).toBe(1);
    expect(m.offlineRateAdd).toBe(0);
    expect(m.startBonus).toEqual({});
  });

  it("applies genMult, stacking multiplicatively for overlapping resources", () => {
    // eco_steel (+15% steel) and eco_all (+10% all) both hit steel.
    const m = computeMods({ eco_steel: true, eco_all: true });
    expect(m.genMult.steel).toBeCloseTo(1.15 * 1.1);
    expect(m.genMult.oil).toBeCloseTo(1.1); // only eco_all
  });

  it("maps res:[...] and res:'all' correctly", () => {
    expect(computeMods({ eco_fuel: true }).genMult.oil).toBeCloseTo(1.25);
    expect(computeMods({ eco_fuel: true }).genMult.rubber).toBeCloseTo(1.25);
    expect(computeMods({ eco_fuel: true }).genMult.steel).toBe(1);
  });

  it("collects force cost, upkeep, stageReq, opSpeed, offline, and startBonus", () => {
    const m = computeMods({ land_inf: true, sea_upkeep: true, land_req: true, air_speed: true, eco_offline: true, eco_reserve: true });
    expect(m.forceCostMult.inf).toBeCloseTo(0.8);
    expect(m.upkeepMult.fleet).toBeCloseTo(0.5);
    expect(m.stageReqDelta).toBe(-1);
    expect(m.opSpeedMult).toBeCloseTo(0.75);
    expect(m.offlineRateAdd).toBeCloseTo(0.2);
    expect(m.startBonus.steel).toBe(250);
  });
});

describe("doctrinePoints", () => {
  it("uses floor(1.5 * sqrt(warTotal))", () => {
    expect(doctrinePoints(0)).toBe(0);
    expect(doctrinePoints(18)).toBe(6); // floor(1.5 * 4.24)
    expect(doctrinePoints(100)).toBe(15); // floor(1.5 * 10)
  });

  it("is safe for missing/negative input", () => {
    expect(doctrinePoints(undefined)).toBe(0);
    expect(doctrinePoints(-5)).toBe(0);
  });
});

describe("totalVictory", () => {
  it("is true only when every theatre reached stage 3", () => {
    const win = { stages: { fallgelb: 3, east: 4, uboat: 3 } };
    const notYet = { stages: { fallgelb: 3, east: 2, uboat: 3 } };
    expect(totalVictory(win, DE)).toBe(true);
    expect(totalVictory(notYet, DE)).toBe(false);
    expect(totalVictory({ stages: {} }, DE)).toBe(false);
  });
});

describe("effectiveForceCost", () => {
  it("reduces each cost by the force multiplier and rounds up", () => {
    const inf = DE.forces.find((f) => f.id === "inf");
    const cost = effectiveForceCost(inf, computeMods({ land_inf: true }));
    expect(cost.rifles).toBe(Math.ceil(40 * 0.8)); // 32
    expect(cost.manpower).toBe(Math.ceil(80 * 0.8)); // 64
  });

  it("returns the original cost object when no reduction applies", () => {
    const inf = DE.forces.find((f) => f.id === "inf");
    expect(effectiveForceCost(inf, computeMods({}))).toBe(inf.cost);
  });
});

describe("effectiveNeed", () => {
  const east = DE.theatres.find((t) => t.id === "east");
  it("lowers requirements by the stageReq delta, floored at 1", () => {
    const need = effectiveNeed(east, 1, computeMods({ land_req: true }));
    expect(need.inf).toBe(Math.max(1, 4 - 1)); // 3
    expect(need.arm).toBe(Math.max(1, 2 - 1)); // 1
  });

  it("never drops below 1", () => {
    const fallgelb = DE.theatres.find((t) => t.id === "fallgelb");
    const need = effectiveNeed(fallgelb, 1, computeMods({ land_req: true }));
    expect(need.air).toBe(1); // 1 - 1 floored to 1
  });
});
