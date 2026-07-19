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

// Standard War Cabinet upgrade set — every nation gets the same levers (foundry
// tap ×3, three Industry steel tiers, radar, three-tier conscription ladder);
// only the names differ. Steel scaling lives here, not in theatres.
const mkUpgrades = (n) => [
  { id: "shift", name: n.shift, desc: "Foundry taps produce 3× steel", cost: { steel: 300 }, tapMult: 3 },
  { id: "ind1", name: n.ind1, desc: "Steel output +25%", cost: { steel: 350 }, outputMult: { res: "steel", mult: 1.25 } },
  { id: "ind2", name: n.ind2, desc: "Steel output +40% more", cost: { steel: 1400 }, req: "ind1", outputMult: { res: "steel", mult: 1.4 } },
  { id: "ind3", name: n.ind3, desc: "All resource output +25%", cost: { steel: 5000 }, req: "ind2", outputMult: { res: "all", mult: 1.25 } },
  { id: "radar", name: n.radar, desc: "Air & naval theatres resolve 25% faster", ws: 3, speeds: ["air", "naval"], factor: 0.75 },
  { id: "law1", name: n.law1, desc: "Manpower growth ×2", ws: 2, manpowerMult: 2 },
  { id: "law2", name: n.law2, desc: "Manpower growth ×4", ws: 6, req: "law1", manpowerMult: 4 },
  { id: "law3", name: n.law3, desc: "Manpower growth ×8", ws: 15, req: "law2", manpowerMult: 8 },
];

export const NATIONS = [
  {
    id: "uk",
    name: "United Kingdom",
    year: "1940",
    faction: "Allies",
    blurb: "Imperial reach — a steady colonial trickle of oil & rubber and a balanced industrial base.",
    identity: "Colonial oil & rubber trickle · balanced",
    theme: { sky: "#0E1822", moon: "#EDE6D3", land: "#1C2B3A", cliff: "#D8D4C4", sea: "#132534", wave: "#2E4B63", factory: "#26394E", chimney: "#31465C", smoke: "#4A6076", plane: "#D9B14B", ship: "#3A5570", balloons: true },
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
    faction: "Axis",
    blurb: "Formidable heavy industry, but oil- and rubber-starved — build Synthetic Refineries to make your own fuel from steel.",
    identity: "Strong industry · oil/rubber-starved · synthetic fuel",
    theme: { sky: "#12161C", moon: "#C9CBB8", land: "#242A21", cliff: null, sea: "#16211C", wave: "#33503F", factory: "#2B3524", chimney: "#3A472F", smoke: "#5A6A48", plane: "#AEB9C4", ship: "#46525E", balloons: false },
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

  {
    id: "usa",
    name: "United States",
    year: "1941",
    faction: "Allies",
    blurb: "A slow mobilisation that becomes an unstoppable arsenal — deep resources and the cheapest factories in the world.",
    identity: "Slow start · monster late industry",
    theme: { sky: "#0E1822", moon: "#EDE6D3", land: "#1E2A38", cliff: null, sea: "#13283A", wave: "#2E5B6B", factory: "#2A3D52", chimney: "#35506A", smoke: "#4E7088", plane: "#C7D2DC", ship: "#3E5A72", balloons: false },
    trickle: {},
    manpowerBase: 0.6,
    tapBase: 2,
    generators: [
      { id: "mill", name: "Steel Foundry", desc: "+1.1 steel/sec", cost: { steel: 22 }, produces: { steel: 1.1 } },
      { id: "smelter", name: "Aluminium Plant", desc: "+0.6 aluminium/sec", cost: { steel: 60 }, produces: { alu: 0.6 } },
      { id: "refinery", name: "Texas Oil Field", desc: "+0.6 oil/sec", cost: { steel: 130 }, produces: { oil: 0.6 } },
      { id: "plantation", name: "Synthetic Rubber Plant", desc: "+0.4 rubber/sec", cost: { steel: 120 }, produces: { rubber: 0.4 } },
      { id: "civ", name: "Civilian Factory", desc: "+10% all resource output", cost: { steel: 150 }, globalMult: 0.1 },
    ],
    forces: [
      { id: "inf", name: "Infantry Division", icon: "🪖", cost: { rifles: 40, artillery: 10, manpower: 80 } },
      { id: "arm", name: "Armored Division", icon: "🚜", cost: { tanks: 15, artillery: 5, manpower: 40 } },
      { id: "air", name: "Army Air Force", icon: "✈️", cost: { fighters: 12, manpower: 30 }, upkeep: { oil: 0.2 } },
      { id: "fleet", name: "Carrier Fleet", icon: "⚓", cost: { ships: 5, manpower: 60 }, upkeep: { oil: 0.4 } },
    ],
    theatres: [
      { id: "guadalcanal", name: "Guadalcanal", icon: "⚓", dur: 120, naval: true, need: (st) => ({ fleet: 2 * st, air: 1 * st }), reward: { kind: "flat", per: { oil: 0.4, rubber: 0.4 } }, rewardText: "+0.4 oil & rubber/sec (island bases) per victory" },
      { id: "torch", name: "North Africa", icon: "🏜️", dur: 150, need: (st) => ({ inf: 3 * st, arm: 1 * st }), reward: { kind: "flat", per: { oil: 1 } }, rewardText: "+1 oil/sec (captured fields) per victory" },
      { id: "normandy", name: "Normandy", icon: "⚔️", dur: 150, air: true, need: (st) => ({ inf: 3 * st, arm: 2 * st, air: 1 * st }), reward: { kind: "mult", res: ["alu"], per: 0.15 }, rewardText: "+15% aluminium output per victory" },
    ],
    upgrades: mkUpgrades({ shift: "War Production Drive", ind1: "War Production Board", ind2: "Arsenal of Democracy", ind3: "Total War Production", radar: "Radar Network", law1: "Selective Service", law2: "Extended Draft", law3: "Full Conscription" }),
  },

  {
    id: "france",
    name: "France",
    year: "1940",
    faction: "Allies",
    blurb: "A colonial empire and a proud artillery arm — resources flow in from overseas territories.",
    identity: "Colonial trickle · artillery doctrine",
    theme: { sky: "#0E1822", moon: "#EDE6D3", land: "#22303F", cliff: null, sea: "#14283A", wave: "#33566B", factory: "#2C3E52", chimney: "#37506A", smoke: "#4E7088", plane: "#8FA7C0", ship: "#3E5A72", balloons: false },
    trickle: { oil: 0.15, rubber: 0.2 },
    manpowerBase: 0.5,
    tapBase: 2,
    generators: [
      { id: "mill", name: "Steel Mill", desc: "+0.95 steel/sec", cost: { steel: 20 }, produces: { steel: 0.95 } },
      { id: "smelter", name: "Aluminium Smelter", desc: "+0.5 aluminium/sec", cost: { steel: 60 }, produces: { alu: 0.5 } },
      { id: "refinery", name: "Oil Refinery", desc: "+0.4 oil/sec", cost: { steel: 140 }, produces: { oil: 0.4 } },
      { id: "plantation", name: "Indochina Plantation", desc: "+0.45 rubber/sec", cost: { steel: 120, oil: 20 }, produces: { rubber: 0.45 } },
      { id: "civ", name: "Civilian Factory", desc: "+10% all resource output", cost: { steel: 200 }, globalMult: 0.1 },
    ],
    forces: [
      { id: "inf", name: "Infantry Division", icon: "🪖", cost: { rifles: 35, artillery: 12, manpower: 80 } },
      { id: "arm", name: "Char Division", icon: "🚜", cost: { tanks: 15, artillery: 5, manpower: 40 } },
      { id: "air", name: "Armée de l'Air", icon: "✈️", cost: { fighters: 12, manpower: 30 }, upkeep: { oil: 0.2 } },
      { id: "fleet", name: "Marine Nationale", icon: "⚓", cost: { ships: 5, manpower: 60 }, upkeep: { oil: 0.4 } },
    ],
    theatres: [
      { id: "france40", name: "Battle of France", icon: "⚔️", dur: 100, air: true, need: (st) => ({ inf: 3 * st, arm: 1 * st, air: 1 * st }), reward: { kind: "mult", res: ["alu"], per: 0.12 }, rewardText: "+12% aluminium output per victory" },
      { id: "medfr", name: "Mediterranean", icon: "⚓", dur: 120, naval: true, need: (st) => ({ fleet: 2 * st }), reward: { kind: "flat", per: { oil: 0.5, rubber: 0.4 } }, rewardText: "+0.5 oil & +0.4 rubber/sec per victory" },
      { id: "freefr", name: "Free French Africa", icon: "🏜️", dur: 150, need: (st) => ({ inf: 3 * st, arm: 1 * st }), reward: { kind: "flat", per: { oil: 1 } }, rewardText: "+1 oil/sec (colonial fields) per victory" },
    ],
    upgrades: mkUpgrades({ shift: "Shift Work", ind1: "War Production Board", ind2: "Heavy Industry", ind3: "Total War Economy", radar: "Radar Network", law1: "Limited Conscription", law2: "Extensive Conscription", law3: "Levée en Masse" }),
  },

  {
    id: "ussr",
    name: "Soviet Union",
    year: "1941",
    faction: "Soviet",
    blurb: "An ocean of manpower behind a battered industry — win through sheer weight of numbers.",
    identity: "Manpower flood · poor factories",
    theme: { sky: "#160F10", moon: "#E3D2B0", land: "#2A211C", cliff: null, sea: "#20201A", wave: "#5A4632", factory: "#33251E", chimney: "#42302A", smoke: "#6A4A3A", plane: "#C2453A", ship: "#4A3A32", balloons: false },
    trickle: {},
    manpowerBase: 1.3,
    tapBase: 2,
    generators: [
      { id: "mill", name: "Steel Combine", desc: "+0.9 steel/sec", cost: { steel: 22 }, produces: { steel: 0.9 } },
      { id: "smelter", name: "Aluminium Works", desc: "+0.45 aluminium/sec", cost: { steel: 65 }, produces: { alu: 0.45 } },
      { id: "refinery", name: "Baku Oil Field", desc: "+0.55 oil/sec", cost: { steel: 130 }, produces: { oil: 0.55 } },
      { id: "plantation", name: "Synthetic Rubber Kombinat", desc: "+0.35 rubber/sec", cost: { steel: 130 }, produces: { rubber: 0.35 } },
      { id: "civ", name: "Civilian Factory", desc: "+10% all resource output", cost: { steel: 240 }, globalMult: 0.1 },
    ],
    forces: [
      { id: "inf", name: "Rifle Division", icon: "🪖", cost: { rifles: 30, artillery: 6, manpower: 70 } },
      { id: "arm", name: "Tank Corps", icon: "🚜", cost: { tanks: 12, artillery: 4, manpower: 40 } },
      { id: "air", name: "Air Regiment", icon: "✈️", cost: { fighters: 12, manpower: 28 }, upkeep: { oil: 0.2 } },
      { id: "fleet", name: "Red Banner Fleet", icon: "⚓", cost: { ships: 5, manpower: 55 }, upkeep: { oil: 0.4 } },
    ],
    theatres: [
      { id: "moscow", name: "Defence of Moscow", icon: "❄️", dur: 120, need: (st) => ({ inf: 4 * st, arm: 1 * st }), reward: { kind: "flat", per: { oil: 0.8 } }, rewardText: "+0.8 oil/sec per victory" },
      { id: "stalingrad", name: "Stalingrad", icon: "⚔️", dur: 150, need: (st) => ({ inf: 5 * st, arm: 2 * st }), reward: { kind: "mult", res: ["alu"], per: 0.12 }, rewardText: "+12% aluminium output per victory" },
      { id: "bagration", name: "Operation Bagration", icon: "🚜", dur: 170, air: true, need: (st) => ({ inf: 4 * st, arm: 2 * st, air: 1 * st }), reward: { kind: "flat", per: { oil: 1, rubber: 0.4 } }, rewardText: "+1 oil & +0.4 rubber/sec per victory" },
    ],
    upgrades: mkUpgrades({ shift: "Stakhanovite Shifts", ind1: "Five-Year Plan", ind2: "Heavy Industry", ind3: "Total War Economy", radar: "Radar Network", law1: "General Mobilisation", law2: "Extended Mobilisation", law3: "Total Mobilisation" }),
  },

  {
    id: "italy",
    name: "Italy",
    year: "1940",
    faction: "Axis",
    blurb: "A Mediterranean navy with shallow reserves — resource-poor and reliant on bold operations.",
    identity: "Mediterranean navy · resource-poor",
    theme: { sky: "#141017", moon: "#E8DCC0", land: "#2A2A20", cliff: null, sea: "#183038", wave: "#356070", factory: "#333322", chimney: "#43432E", smoke: "#6A6A48", plane: "#A8B0A0", ship: "#46564E", balloons: false },
    trickle: {},
    manpowerBase: 0.5,
    tapBase: 2,
    generators: [
      { id: "mill", name: "Steel Mill", desc: "+0.9 steel/sec", cost: { steel: 22 }, produces: { steel: 0.9 } },
      { id: "smelter", name: "Aluminium Plant", desc: "+0.5 aluminium/sec", cost: { steel: 60 }, produces: { alu: 0.5 } },
      { id: "refinery", name: "Oil Refinery", desc: "+0.35 oil/sec (oil-poor)", cost: { steel: 140 }, produces: { oil: 0.35 } },
      { id: "plantation", name: "Rubber Importer", desc: "+0.35 rubber/sec", cost: { steel: 120 }, produces: { rubber: 0.35 } },
      { id: "civ", name: "Civilian Factory", desc: "+10% all resource output", cost: { steel: 190 }, globalMult: 0.1 },
    ],
    forces: [
      { id: "inf", name: "Fanteria Division", icon: "🪖", cost: { rifles: 40, artillery: 10, manpower: 80 } },
      { id: "arm", name: "Armoured Division", icon: "🚜", cost: { tanks: 15, artillery: 5, manpower: 40 } },
      { id: "air", name: "Regia Aeronautica", icon: "✈️", cost: { fighters: 12, manpower: 30 }, upkeep: { oil: 0.2 } },
      { id: "fleet", name: "Regia Marina", icon: "⚓", cost: { ships: 4, manpower: 55 }, upkeep: { oil: 0.4 } },
    ],
    theatres: [
      { id: "medit", name: "Mediterranean", icon: "⚓", dur: 120, naval: true, need: (st) => ({ fleet: 2 * st }), reward: { kind: "flat", per: { oil: 0.5, rubber: 0.4 } }, rewardText: "+0.5 oil & +0.4 rubber/sec per victory" },
      { id: "nafrica", name: "North Africa", icon: "🏜️", dur: 150, need: (st) => ({ inf: 3 * st, arm: 1 * st }), reward: { kind: "flat", per: { oil: 1 } }, rewardText: "+1 oil/sec per victory" },
      { id: "balkans", name: "Balkans", icon: "⚔️", dur: 130, air: true, need: (st) => ({ inf: 3 * st, air: 1 * st }), reward: { kind: "mult", res: ["alu"], per: 0.12 }, rewardText: "+12% aluminium output per victory" },
    ],
    upgrades: mkUpgrades({ shift: "Shift Work", ind1: "War Production Board", ind2: "Heavy Industry", ind3: "Total War Economy", radar: "Radar Network", law1: "Limited Conscription", law2: "Extensive Conscription", law3: "Total Mobilisation" }),
  },

  {
    id: "japan",
    name: "Japan",
    year: "1941",
    faction: "Axis",
    blurb: "Carrier fleets and airpower over the Pacific, but starved of steel at home — seize resources abroad.",
    identity: "Naval & air power · steel-poor",
    theme: { sky: "#12131A", moon: "#C24A3A", land: "#20242C", cliff: null, sea: "#132430", wave: "#2E5566", factory: "#28303A", chimney: "#343E4A", smoke: "#4E6070", plane: "#B8C0C8", ship: "#3E4E5C", balloons: false },
    trickle: {},
    manpowerBase: 0.5,
    tapBase: 2,
    generators: [
      { id: "mill", name: "Steel Works", desc: "+0.95 steel/sec (steel-poor)", cost: { steel: 22 }, produces: { steel: 0.95 } },
      { id: "smelter", name: "Aluminium Plant", desc: "+0.55 aluminium/sec", cost: { steel: 60 }, produces: { alu: 0.55 } },
      { id: "refinery", name: "Oil Refinery", desc: "+0.35 oil/sec", cost: { steel: 140 }, produces: { oil: 0.35 } },
      { id: "plantation", name: "Southern Resource Zone", desc: "+0.5 rubber/sec", cost: { steel: 120 }, produces: { rubber: 0.5 } },
      { id: "civ", name: "Civilian Factory", desc: "+10% all resource output", cost: { steel: 190 }, globalMult: 0.1 },
    ],
    forces: [
      { id: "inf", name: "Infantry Division", icon: "🪖", cost: { rifles: 40, artillery: 10, manpower: 80 } },
      { id: "arm", name: "Tank Regiment", icon: "🚜", cost: { tanks: 15, artillery: 5, manpower: 40 } },
      { id: "air", name: "Naval Air Group", icon: "✈️", cost: { fighters: 10, manpower: 28 }, upkeep: { oil: 0.2 } },
      { id: "fleet", name: "Combined Fleet", icon: "⚓", cost: { ships: 4, manpower: 55 }, upkeep: { oil: 0.4 } },
    ],
    theatres: [
      { id: "pacific", name: "Pacific Offensive", icon: "⚓", dur: 120, naval: true, air: true, need: (st) => ({ fleet: 2 * st, air: 1 * st }), reward: { kind: "flat", per: { oil: 0.5, rubber: 0.5 } }, rewardText: "+0.5 oil & rubber/sec (seized fields) per victory" },
      { id: "coralsea", name: "Coral Sea", icon: "✈️", dur: 120, naval: true, need: (st) => ({ fleet: 2 * st }), reward: { kind: "mult", res: ["alu"], per: 0.15 }, rewardText: "+15% aluminium output per victory" },
      { id: "burma", name: "Burma", icon: "🏜️", dur: 150, need: (st) => ({ inf: 3 * st, arm: 1 * st }), reward: { kind: "flat", per: { oil: 1 } }, rewardText: "+1 oil/sec per victory" },
    ],
    upgrades: mkUpgrades({ shift: "Shift Work", ind1: "War Production Board", ind2: "Heavy Industry", ind3: "Total War Economy", radar: "Radar Network", law1: "Limited Conscription", law2: "Extensive Conscription", law3: "Total Mobilisation" }),
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
