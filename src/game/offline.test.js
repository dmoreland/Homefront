import { describe, it, expect } from "vitest";
import { applyOffline, OFFLINE_CAP_HOURS } from "./offline.js";
import { FRESH } from "../data/gameData.js";
import { getNation } from "../data/nations.js";

const UK = getNation("uk");

const mk = (o = {}) => ({
  res: { ...FRESH.res, ...o.res },
  eq: { ...FRESH.eq, ...o.eq },
  owned: { ...o.owned },
  upgrades: {}, forces: {}, stages: {}, missions: [], warScore: 0, taps: 0,
});

describe("applyOffline", () => {
  it("does nothing without a savedAt timestamp", () => {
    const g = mk({ owned: { mill: 1 } });
    expect(applyOffline(g, undefined, 10_000_000, UK).game).toBe(g);
  });

  it("ignores gaps shorter than the minimum", () => {
    const g = mk({ owned: { mill: 1 } });
    const now = 100_000;
    expect(applyOffline(g, now - 10_000, now, UK).game).toBe(g); // 10s gap
  });

  it("awards resources at half rate over the elapsed time", () => {
    const g = mk({ owned: { mill: 1 } }); // 1 steel/sec
    const now = 1_000_000;
    const { game, elapsed } = applyOffline(g, now - 3600 * 1000, now, UK); // 1h away
    expect(elapsed).toBeCloseTo(3600);
    expect(game.res.steel).toBeCloseTo(3600 * 0.5); // 1/s * 3600s * 50%
  });

  it("caps elapsed time at the offline cap", () => {
    const g = mk({ owned: { mill: 1 } });
    const now = 100_000_000;
    const daysAway = 48 * 3600 * 1000;
    const { elapsed } = applyOffline(g, now - daysAway, now, UK);
    expect(elapsed).toBe(OFFLINE_CAP_HOURS * 3600);
  });
});
