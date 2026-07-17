import { LINES } from "../data/gameData.js";

// Pure simulation step — used by the live 250ms tick AND offline earnings.
// Given a game state, a timestep dt (seconds), the active nation config, and an
// optional doctrine `mods` bundle, returns advanced resource/equipment stocks
// plus derived rates (gen, net, upkeep, lineStatus, convStatus). Does NOT
// mutate the input. `mods` is optional; omitting it means no doctrine effects.
//
// Generation model (per resource):
//   producers × count × civMult × theatreMult   (buildings)
//   + passive trickle                            (flat, nation)
//   + theatre flat rewards × stages              (flat)
//   × doctrine genMult                           (War Economy branch)
//   then converters (e.g. Synthetic Refinery) trade one resource for another,
//   then production lines consume resources to make equipment. Converters and
//   lines both throttle proportionally when their inputs are starved.
export function simulate(s, dt, nation, mods) {
  const genMult = mods?.genMult || {};
  const upkeepMult = mods?.upkeepMult || {};
  const res = { ...s.res };
  const eq = { ...s.eq };

  // Civilian Factory: a generator with globalMult gives +mult per copy to all producers.
  const civBuilding = nation.generators.find((g) => g.globalMult);
  const civMult = 1 + (civBuilding ? civBuilding.globalMult * (s.owned[civBuilding.id] || 0) : 0);

  // Conscription laws: the highest owned law sets the manpower multiplier.
  let lawMult = 1;
  for (const u of nation.upgrades) {
    if (u.manpowerMult && s.upgrades[u.id]) lawMult = Math.max(lawMult, u.manpowerMult);
  }

  // Theatre output multipliers (e.g. Battle of Britain: +15% steel & alu per victory).
  const mult = { steel: 1, alu: 1, oil: 1, rubber: 1, manpower: 1 };
  for (const t of nation.theatres) {
    const st = s.stages[t.id] || 0;
    if (st && t.reward.kind === "mult") for (const r of t.reward.res) mult[r] *= 1 + t.reward.per * st;
  }

  // Base generation from producer buildings.
  const gen = { steel: 0, alu: 0, oil: 0, rubber: 0, manpower: 0 };
  for (const g of nation.generators) {
    if (!g.produces) continue;
    const n = s.owned[g.id] || 0;
    if (!n) continue;
    for (const r in g.produces) gen[r] += n * g.produces[r] * civMult * mult[r];
  }
  // Passive nation trickle (flat, not multiplied).
  for (const r in nation.trickle) gen[r] += nation.trickle[r];
  // Theatre flat rewards, per victory (e.g. +1 oil/sec per Eastern Front win).
  for (const t of nation.theatres) {
    const st = s.stages[t.id] || 0;
    if (st && t.reward.kind === "flat") for (const r in t.reward.per) gen[r] += t.reward.per[r] * st;
  }
  gen.manpower = nation.manpowerBase * lawMult;

  // Doctrine War Economy multipliers apply to all base generation.
  for (const r in gen) gen[r] *= genMult[r] ?? 1;

  // Force upkeep (oil) from air wings / fleets, reduced by Sea doctrines.
  let upkeep = 0;
  for (const f of nation.forces) {
    if (f.upkeep?.oil) upkeep += (s.forces[f.id] || 0) * f.upkeep.oil * (upkeepMult[f.id] ?? 1);
  }

  // Apply base generation to the stockpile (oil nets upkeep and clamps at 0).
  res.steel += gen.steel * dt;
  res.alu += gen.alu * dt;
  res.oil = Math.max(0, res.oil + (gen.oil - upkeep) * dt);
  res.rubber += gen.rubber * dt;
  res.manpower += gen.manpower * dt;

  const cons = { steel: 0, alu: 0, oil: 0, rubber: 0, manpower: 0 };

  // Converters (Synthetic Refinery): consume inputs, produce output resources.
  // Throttle by available input, and fold into gen/cons so net flow stays honest.
  const convStatus = {};
  for (const g of nation.generators) {
    if (!g.converts) continue;
    const n = s.owned[g.id] || 0;
    if (!n) continue;
    let frac = 1;
    for (const k in g.converts.in) {
      const need = g.converts.in[k] * n * dt;
      frac = Math.min(frac, need > 0 ? res[k] / need : 1);
    }
    frac = Math.max(0, Math.min(1, frac));
    for (const k in g.converts.in) {
      res[k] -= g.converts.in[k] * n * dt * frac;
      cons[k] += g.converts.in[k] * n * frac;
    }
    for (const k in g.converts.out) {
      res[k] += g.converts.out[k] * n * dt * frac;
      gen[k] += g.converts.out[k] * n * frac;
    }
    convStatus[g.id] = frac;
  }

  // Production lines: consume resources to make equipment, throttling when starved.
  const lineStatus = {};
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
      cons[k] += line.cons[k] * n * frac;
    }
    eq[line.out] = (eq[line.out] || 0) + line.rate * n * dt * frac;
    lineStatus[line.id] = frac;
  }

  // Net flow per resource — what the stockpile is actually doing.
  const net = {
    steel: gen.steel - cons.steel,
    alu: gen.alu - cons.alu,
    oil: gen.oil - upkeep - cons.oil,
    rubber: gen.rubber - cons.rubber,
    manpower: gen.manpower,
  };
  return { res, eq, gen, net, upkeep, lineStatus, convStatus };
}
