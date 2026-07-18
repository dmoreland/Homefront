import { describe, it, expect } from "vitest";
import { applyFuelPenalty, isFuelStarved, FUEL_SLOW } from "./theatres.js";
import { getNation } from "../data/nations.js";

const UK = getNation("uk");

describe("isFuelStarved", () => {
  it("is true only when oil is empty and demand exceeds supply", () => {
    expect(isFuelStarved({ oil: 0 }, { oil: -0.4 })).toBe(true);
    expect(isFuelStarved({ oil: 5 }, { oil: -0.4 })).toBe(false); // still have stock
    expect(isFuelStarved({ oil: 0 }, { oil: 0.2 })).toBe(false); // net positive
  });
});

describe("applyFuelPenalty", () => {
  const airMission = { theatre: "bob", stage: 1, forces: { air: 2 }, endsAt: 100_000 };
  const landMission = { theatre: "africa", stage: 1, forces: { inf: 3 }, endsAt: 100_000 };

  it("pushes air/naval mission endsAt forward while starved", () => {
    const [m] = applyFuelPenalty([airMission], UK, true, 1);
    expect(m.endsAt).toBe(100_000 + FUEL_SLOW * 1 * 1000); // +500ms per starved second
  });

  it("leaves land operations unaffected", () => {
    const [m] = applyFuelPenalty([landMission], UK, true, 1);
    expect(m.endsAt).toBe(100_000);
  });

  it("does nothing when not starved (same array reference)", () => {
    const missions = [airMission];
    expect(applyFuelPenalty(missions, UK, false, 1)).toBe(missions);
  });

  it("halves effective progress over a full duration of starvation", () => {
    // 90s nominal op, starved every 1s tick, should take ~180s of real time.
    let m = { theatre: "bob", stage: 1, forces: {}, endsAt: 90 * 1000 };
    for (let t = 0; t < 180; t++) m = applyFuelPenalty([m], UK, true, 1)[0];
    expect(m.endsAt).toBeCloseTo(90 * 1000 + 180 * FUEL_SLOW * 1000);
  });
});
