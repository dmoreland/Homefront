import { FRESH } from "./gameData.js";

// =====================================================
// NATIONS — each nation is a data object. Adding a nation is a config
// change: append an entry here. Nations share the resource set and the
// production-line chain (gameData.js) but differ in:
//   - starting resources & passive resource trickle
//   - generators (incl. unique buildings like the Synthetic Refinery)
//   - force names/icons (same id slots: inf, arm, air, fleet)
//   - theatres (requirements + stacking economic rewards)
//   - upgrades / conscription laws
//
// Data shapes read by the engine:
//   generator producer:  { produces: { steel: 1 } }        // scaled by civ & theatre mult
//   generator globalMult:{ globalMult: 0.1 }               // Civilian Factory, +10% all
//   generator converter: { converts: { in: {...}, out: {...} } }  // throttles like a line
//   force:               { cost: {...}, upkeep: { oil: 0.2 } }
//   theatre reward mult: { kind: "mult", res: ["steel","alu"], per: 0.15 }
//   theatre reward flat: { kind: "flat", per: { oil: 1 } }  // per victory (stage)
//   upgrade law:         { ws, req, manpowerMult: 2 }
//   upgrade speed:       { ws, speeds: ["air","naval"], factor: 0.75 }
//   upgrade tap:         { cost, tapMult: 3 }
// =====================================================

export const NATIONS = [
  {
    id: "uk",
    name: "United Kingdom",
    year: "1940",
    blurb: "Imperial reach — a steady colonial trickle of oil & rubber and a balanced industrial base.",
    identity: "Colonial oil & rubber trickle · balanced",
    trickle: { oil: 0.2, rubber: 0.2 },
    manpowerBase: 0.5,
    tapBase: 2,
    generators: [
      { id: "mill", name: "Steel Mill", desc: "+1.0 steel/sec", cost: { steel: 20 }, produces: { steel: 1 } },
      { id: "smelter", name: "Aluminium Smelter", desc: "+0.5 aluminium/sec", cost: { steel: 60 }, produces: { alu: 0.5 } },
      { id: "refinery", name: "Oil Refinery", desc: "+0.5 oil/sec", cost: { steel: 140 }, produces: { oil: 0.5 } },
      { id: "plantation", name: "Colonial Plantation", desc: "+0.4 rubber/sec", cost: { steel: 120, oil: 20 }, produces: { rubber: 0.4 } },
      { id: "civ", name: "Civilian Factory", desc: "+10% all resource output", cost: { steel: 200 }, globalMult: 0.1 },
    ],
    forces: [
      { id: "inf", name: "Infantry Division", icon: "🪖", cost: { rifles: 40, artillery: 10, manpower: 80 } },
      { id: "arm", name: "Armoured Division", icon: "🚜", cost: { tanks: 15, artillery: 5, manpower: 40 } },
      { id: "air", name: "Air Wing", icon: "✈️", cost: { fighters: 12, manpower: 30 }, upkeep: { oil: 0.2 } },
      { id: "fleet", name: "Fleet", icon: "⚓", cost: { ships: 5, manpower: 60 }, upkeep: { oil: 0.4 } },
    ],
    theatres: [
      { id: "bob", name: "Battle of Britain", icon: "✈️", dur: 90, air: true, need: (st) => ({ air: 2 * st }), reward: { kind: "mult", res: ["alu"], per: 0.15 }, rewardText: "+15% aluminium output (aircraft plants) per victory" },
      { id: "atlantic", name: "Battle of the Atlantic", icon: "⚓", dur: 120, naval: true, need: (st) => ({ fleet: 2 * st }), reward: { kind: "flat", per: { oil: 0.5, rubber: 0.5 } }, rewardText: "+0.5 oil & rubber/sec convoys per victory" },
      { id: "africa", name: "North Africa", icon: "🏜️", dur: 150, need: (st) => ({ inf: 3 * st, arm: 1 * st }), reward: { kind: "flat", per: { oil: 1 } }, rewardText: "+1 oil/sec Middle East fields per victory" },
    ],
    upgrades: [
      { id: "shift", name: "Shift Work", desc: "Foundry taps produce 3× steel", cost: { steel: 300 }, tapMult: 3 },
      { id: "ind1", name: "War Production Board", desc: "Steel output +25%", cost: { steel: 350 }, outputMult: { res: "steel", mult: 1.25 } },
      { id: "ind2", name: "Heavy Industry", desc: "Steel output +40% more", cost: { steel: 1400 }, req: "ind1", outputMult: { res: "steel", mult: 1.4 } },
      { id: "ind3", name: "Total War Production", desc: "All resource output +25%", cost: { steel: 5000 }, req: "ind2", outputMult: { res: "all", mult: 1.25 } },
      { id: "radar", name: "Radar Network", desc: "Air & naval theatres resolve 25% faster", ws: 3, speeds: ["air", "naval"], factor: 0.75 },
      { id: "law1", name: "Limited Conscription", desc: "Manpower growth ×2", ws: 2, manpowerMult: 2 },
      { id: "law2", name: "Extensive Conscription", desc: "Manpower growth ×4", ws: 6, req: "law1", manpowerMult: 4 },
      { id: "law3", name: "Service by Requirement", desc: "Manpower growth ×8", ws: 15, req: "law2", manpowerMult: 8 },
    ],
  },

  {
    id: "germany",
    name: "Germany",
    year: "1939",
    blurb: "Formidable heavy industry, but oil- and rubber-starved — build Synthetic Refineries to make your own fuel from steel.",
    identity: "Strong industry · oil/rubber-starved · synthetic fuel",
    trickle: {}, // no colonial trickle — fuel must be synthesised or seized
    manpowerBase: 0.5,
    tapBase: 2,
    generators: [
      { id: "mill", name: "Ruhr Steel Works", desc: "+1.2 steel/sec", cost: { steel: 20 }, produces: { steel: 1.2 } },
      { id: "smelter", name: "Aluminium Plant", desc: "+0.5 aluminium/sec", cost: { steel: 60 }, produces: { alu: 0.5 } },
      { id: "refinery", name: "Domestic Oil Well", desc: "+0.3 oil/sec (oil-poor)", cost: { steel: 140 }, produces: { oil: 0.3 } },
      { id: "synth", name: "Synthetic Refinery", desc: "Converts 2 steel/sec → 0.4 oil + 0.35 rubber/sec", cost: { steel: 180 }, converts: { in: { steel: 2 }, out: { oil: 0.4, rubber: 0.35 } } },
      { id: "civ", name: "Civilian Factory", desc: "+10% all resource output", cost: { steel: 200 }, globalMult: 0.1 },
    ],
    forces: [
      { id: "inf", name: "Wehrmacht Infantry", icon: "🪖", cost: { rifles: 40, artillery: 10, manpower: 80 } },
      { id: "arm", name: "Panzer Division", icon: "🚜", cost: { tanks: 15, artillery: 5, manpower: 40 } },
      { id: "air", name: "Luftwaffe Wing", icon: "✈️", cost: { fighters: 12, manpower: 30 }, upkeep: { oil: 0.2 } },
      { id: "fleet", name: "Kriegsmarine Fleet", icon: "⚓", cost: { ships: 5, manpower: 60 }, upkeep: { oil: 0.4 } },
    ],
    theatres: [
      { id: "fallgelb", name: "Fall Gelb", icon: "⚔️", dur: 90, air: true, need: (st) => ({ inf: 2 * st, arm: 1 * st, air: 1 * st }), reward: { kind: "mult", res: ["alu"], per: 0.15 }, rewardText: "+15% aluminium output (captured aircraft industry) per victory" },
      { id: "east", name: "Eastern Front", icon: "❄️", dur: 180, need: (st) => ({ inf: 4 * st, arm: 2 * st }), reward: { kind: "flat", per: { oil: 1 } }, rewardText: "+1 oil/sec (Caucasus fields) per victory" },
      { id: "uboat", name: "Atlantic U-boats", icon: "⚓", dur: 120, naval: true, need: (st) => ({ fleet: 2 * st }), reward: { kind: "flat", per: { oil: 0.3, rubber: 0.4 } }, rewardText: "+0.3 oil & +0.4 rubber/sec (raided convoys) per victory" },
    ],
    upgrades: [
      { id: "shift", name: "War Economy", desc: "Foundry taps produce 3× steel", cost: { steel: 300 }, tapMult: 3 },
      { id: "ind1", name: "Ruhr Expansion", desc: "Steel output +25%", cost: { steel: 350 }, outputMult: { res: "steel", mult: 1.25 } },
      { id: "ind2", name: "Heavy Industry Drive", desc: "Steel output +40% more", cost: { steel: 1400 }, req: "ind1", outputMult: { res: "steel", mult: 1.4 } },
      { id: "ind3", name: "Total Industrial Mobilisation", desc: "All resource output +25%", cost: { steel: 5000 }, req: "ind2", outputMult: { res: "all", mult: 1.25 } },
      { id: "radar", name: "Freya Radar", desc: "Air & naval theatres resolve 25% faster", ws: 3, speeds: ["air", "naval"], factor: 0.75 },
      { id: "law1", name: "Conscription Act", desc: "Manpower growth ×2", ws: 2, manpowerMult: 2 },
      { id: "law2", name: "Extended Service", desc: "Manpower growth ×4", ws: 6, req: "law1", manpowerMult: 4 },
      { id: "law3", name: "Total Mobilisation", desc: "Manpower growth ×8", ws: 15, req: "law2", manpowerMult: 8 },
    ],
  },
];

export function getNation(id) {
  return NATIONS.find((n) => n.id === id) || null;
}

// Fresh campaign state for a nation: base template + its id and starting resources.
export function newGame(nation) {
  return {
    ...FRESH,
    nationId: nation.id,
    res: { ...FRESH.res, ...(nation.start?.res || {}) },
  };
}
