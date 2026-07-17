import { describe, it, expect } from "vitest";
import { NATIONS, getNation, newGame } from "./nations.js";
import { LINES } from "./gameData.js";

const RES_KEYS = ["steel", "alu", "oil", "rubber", "manpower"];
const EQ_KEYS = LINES.map((l) => l.out);

describe("nation configs", () => {
  it("have unique ids and the required top-level fields", () => {
    const ids = NATIONS.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const n of NATIONS) {
      expect(n.name && n.year && n.blurb).toBeTruthy();
      expect(typeof n.manpowerBase).toBe("number");
      expect(n.generators.length).toBeGreaterThan(0);
      expect(n.forces.length).toBeGreaterThan(0);
      expect(n.theatres.length).toBeGreaterThan(0);
      expect(n.upgrades.length).toBeGreaterThan(0);
    }
  });

  it("only ever produce/convert known resources", () => {
    for (const n of NATIONS) {
      for (const g of n.generators) {
        for (const r in g.produces || {}) expect(RES_KEYS).toContain(r);
        for (const r in g.converts?.in || {}) expect(RES_KEYS).toContain(r);
        for (const r in g.converts?.out || {}) expect(RES_KEYS).toContain(r);
      }
    }
  });

  it("theatre requirements reference real force ids and scale with stage", () => {
    for (const n of NATIONS) {
      const forceIds = new Set(n.forces.map((f) => f.id));
      for (const t of n.theatres) {
        const s1 = t.need(1);
        const s2 = t.need(2);
        for (const k in s1) {
          expect(forceIds.has(k)).toBe(true);
          expect(s2[k]).toBe(s1[k] * 2); // ×2 requirement per victory
        }
      }
    }
  });

  it("force costs reference real equipment or manpower", () => {
    const valid = new Set([...EQ_KEYS, "manpower"]);
    for (const n of NATIONS) {
      for (const f of n.forces) {
        for (const k in f.cost) expect(valid.has(k)).toBe(true);
      }
    }
  });

  it("newGame seeds a fresh campaign for the nation", () => {
    const g = newGame(getNation("germany"));
    expect(g.nationId).toBe("germany");
    expect(g.warScore).toBe(0);
    expect(g.missions).toEqual([]);
  });
});
