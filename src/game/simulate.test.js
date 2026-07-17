import { describe, it, expect } from "vitest";
import { simulate } from "./simulate.js";
import { FRESH } from "../data/gameData.js";
import { getNation } from "../data/nations.js";

const UK = getNation("uk");
const DE = getNation("germany");

// Deep-ish clone of FRESH with overrides, so tests never share mutable state.
const mk = (o = {}) => ({
  res: { ...FRESH.res, ...o.res },
  eq: { ...FRESH.eq, ...o.eq },
  owned: { ...o.owned },
  upgrades: { ...o.upgrades },
  forces: { ...o.forces },
  stages: { ...o.stages },
  missions: [],
  warScore: 0,
  taps: 0,
});

describe("simulate — UK generation", () => {
  it("applies the passive Empire trickle with no buildings", () => {
    const r = simulate(mk(), 1, UK);
    expect(r.gen.oil).toBeCloseTo(0.2);
    expect(r.gen.rubber).toBeCloseTo(0.2);
    expect(r.gen.manpower).toBeCloseTo(0.5);
    expect(r.gen.steel).toBe(0);
    expect(r.res.oil).toBeCloseTo(0.2);
    expect(r.res.manpower).toBeCloseTo(0.5);
  });

  it("produces steel from mills scaled by civilian factories", () => {
    const r = simulate(mk({ owned: { mill: 2, civ: 1 } }), 1, UK);
    expect(r.gen.steel).toBeCloseTo(2.2); // 2 * 1 * (1 + 0.1*1)
    expect(r.res.steel).toBeCloseTo(2.2);
  });

  it("multiplies manpower by conscription laws", () => {
    expect(simulate(mk({ upgrades: { law1: true } }), 1, UK).gen.manpower).toBeCloseTo(1.0);
    expect(simulate(mk({ upgrades: { law1: true, law2: true } }), 1, UK).gen.manpower).toBeCloseTo(2.0);
    expect(simulate(mk({ upgrades: { law1: true, law2: true, law3: true } }), 1, UK).gen.manpower).toBeCloseTo(4.0);
  });

  it("boosts steel & aluminium output per Battle of Britain victory", () => {
    const r = simulate(mk({ owned: { mill: 1, smelter: 1 }, stages: { bob: 2 } }), 1, UK);
    expect(r.gen.steel).toBeCloseTo(1.3); // 1 * (1 + 0.15*2)
    expect(r.gen.alu).toBeCloseTo(0.65); // 0.5 * 1.3
  });

  it("adds theatre convoy bonuses to oil & rubber generation", () => {
    const r = simulate(mk({ stages: { africa: 1, atlantic: 2 } }), 1, UK);
    expect(r.gen.oil).toBeCloseTo(0.2 + 1 + 1.0); // trickle + africa + atlantic*0.5*2
    expect(r.gen.rubber).toBeCloseTo(0.2 + 1.0); // trickle + atlantic*0.5*2
  });
});

describe("simulate — production lines", () => {
  it("consumes inputs and produces equipment when fully fed", () => {
    const r = simulate(mk({ owned: { rifleLine: 1 }, res: { steel: 10 } }), 1, UK);
    expect(r.lineStatus.rifleLine).toBe(1);
    expect(r.eq.rifles).toBeCloseTo(0.5);
    expect(r.res.steel).toBeCloseTo(9); // 10 - 1 consumed
  });

  it("throttles proportionally and reports STALLED fraction when starved", () => {
    const r = simulate(mk({ owned: { rifleLine: 1 }, res: { steel: 0.5 } }), 1, UK);
    expect(r.lineStatus.rifleLine).toBeCloseTo(0.5);
    expect(r.eq.rifles).toBeCloseTo(0.25); // 0.5 rate * 0.5 throttle
    expect(r.res.steel).toBeCloseTo(0); // all available steel consumed
  });

  it("reports net flow as generation minus line consumption", () => {
    const r = simulate(mk({ owned: { mill: 1, rifleLine: 1 }, res: { steel: 10 } }), 1, UK);
    expect(r.net.steel).toBeCloseTo(0); // gen 1 - cons 1
  });
});

describe("simulate — oil upkeep", () => {
  it("subtracts air/fleet upkeep and clamps oil at zero", () => {
    const r = simulate(mk({ forces: { fleet: 1 } }), 1, UK);
    expect(r.upkeep).toBeCloseTo(0.4);
    expect(r.res.oil).toBe(0); // 0 + (0.2 - 0.4) clamped
    expect(r.net.oil).toBeCloseTo(0.2 - 0.4);
  });
});

describe("simulate — Germany identity", () => {
  it("has no passive oil/rubber trickle", () => {
    const r = simulate(mk(), 1, DE);
    expect(r.gen.oil).toBe(0);
    expect(r.gen.rubber).toBe(0);
    expect(r.gen.manpower).toBeCloseTo(0.5);
  });

  it("has stronger steel mills than the UK", () => {
    const r = simulate(mk({ owned: { mill: 1 } }), 1, DE);
    expect(r.gen.steel).toBeCloseTo(1.2);
  });

  it("Synthetic Refinery converts steel into oil & rubber when fed", () => {
    const r = simulate(mk({ owned: { synth: 1 }, res: { steel: 10 } }), 1, DE);
    expect(r.convStatus.synth).toBe(1);
    expect(r.res.oil).toBeCloseTo(0.4);
    expect(r.res.rubber).toBeCloseTo(0.35);
    expect(r.res.steel).toBeCloseTo(8); // 10 - 2 consumed
    // Net flow reflects both the produced fuel and the steel drawn.
    expect(r.net.oil).toBeCloseTo(0.4);
    expect(r.net.steel).toBeCloseTo(-2);
  });

  it("Synthetic Refinery throttles when steel is insufficient", () => {
    const r = simulate(mk({ owned: { synth: 1 }, res: { steel: 1 } }), 1, DE);
    expect(r.convStatus.synth).toBeCloseTo(0.5); // only half the 2 steel needed
    expect(r.res.oil).toBeCloseTo(0.2);
    expect(r.res.rubber).toBeCloseTo(0.175);
    expect(r.res.steel).toBeCloseTo(0);
  });
});

describe("simulate — purity", () => {
  it("does not mutate the input state", () => {
    const s = mk({ owned: { mill: 1, rifleLine: 1 }, res: { steel: 5 } });
    const snapshot = JSON.stringify(s);
    simulate(s, 1, UK);
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});
