import { LINES } from "../data/gameData.js";

// Pure simulation step — used by the live 250ms tick AND offline earnings.
// Given a game state and a timestep dt (seconds), returns the advanced
// resource/equipment stocks plus derived rates (gen, net, upkeep, lineStatus).
// Does NOT mutate the input state.
export function simulate(s, dt) {
  const civMult = 1 + 0.1 * (s.owned.civ || 0);
  const lawMult = s.upgrades.law3 ? 8 : s.upgrades.law2 ? 4 : s.upgrades.law1 ? 2 : 1;
  const bobMult = 1 + 0.15 * (s.stages.bob || 0);
  const res = { ...s.res };
  const eq = { ...s.eq };

  const gen = {
    steel: (s.owned.mill || 0) * 1 * civMult * bobMult,
    alu: (s.owned.smelter || 0) * 0.5 * civMult * bobMult,
    oil: (s.owned.refinery || 0) * 0.5 * civMult + 0.2 + (s.stages.africa || 0) * 1 + (s.stages.atlantic || 0) * 0.5,
    rubber: (s.owned.plantation || 0) * 0.4 * civMult + 0.2 + (s.stages.atlantic || 0) * 0.5,
    manpower: 0.5 * lawMult,
  };
  const upkeep = (s.forces.air || 0) * 0.2 + (s.forces.fleet || 0) * 0.4;

  res.steel += gen.steel * dt;
  res.alu += gen.alu * dt;
  res.oil = Math.max(0, res.oil + (gen.oil - upkeep) * dt);
  res.rubber += gen.rubber * dt;
  res.manpower += gen.manpower * dt;

  const lineStatus = {};
  const cons = { steel: 0, alu: 0, oil: 0, rubber: 0, manpower: 0 };
  for (const line of LINES) {
    const n = s.owned[line.id] || 0;
    if (!n) continue;
    let frac = 1;
    for (const k in line.cons) {
      const need = line.cons[k] * n * dt;
      frac = Math.min(frac, need > 0 ? res[k] / need : 1);
    }
    frac = Math.max(0, Math.min(1, frac));
    for (const k in line.cons) {
      res[k] -= line.cons[k] * n * dt * frac;
      cons[k] += line.cons[k] * n * frac; // per-second rate at current throttle
    }
    eq[line.out] = (eq[line.out] || 0) + line.rate * n * dt * frac;
    lineStatus[line.id] = frac;
  }
  // Net flow per resource — what the stockpile is actually doing
  const net = {
    steel: gen.steel - cons.steel,
    alu: gen.alu - cons.alu,
    oil: gen.oil - upkeep - cons.oil,
    rubber: gen.rubber - cons.rubber,
    manpower: gen.manpower,
  };
  return { res, eq, gen, net, upkeep, lineStatus };
}
