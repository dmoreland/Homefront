// =====================================================
// HOME FRONT — data tables (all balance lives here)
// v1: United Kingdom. Resource chain: raw resources ->
// production lines -> equipment -> forces -> theatre victories.
// =====================================================

export const RES = [
  { key: "steel", label: "Steel", icon: "⚙️", color: "#B8C4CE" },
  { key: "alu", label: "Aluminium", icon: "🧱", color: "#9FB4C7" },
  { key: "oil", label: "Oil", icon: "🛢️", color: "#C9A227" },
  { key: "rubber", label: "Rubber", icon: "🛞", color: "#8FA37A" },
  { key: "manpower", label: "Manpower", icon: "👥", color: "#D9B14B" },
];

export const GENERATORS = [
  { id: "mill", name: "Steel Mill", desc: "+1.0 steel/sec", cost: { steel: 20 } },
  { id: "smelter", name: "Aluminium Smelter", desc: "+0.5 aluminium/sec", cost: { steel: 60 } },
  { id: "refinery", name: "Oil Refinery", desc: "+0.5 oil/sec", cost: { steel: 140 } },
  { id: "plantation", name: "Colonial Plantation", desc: "+0.4 rubber/sec", cost: { steel: 120, oil: 20 } },
  { id: "civ", name: "Civilian Factory", desc: "+10% all resource output", cost: { steel: 400 } },
];

export const LINES = [
  { id: "rifleLine", name: "Rifle Line", out: "rifles", outName: "Rifles", rate: 0.5, cons: { steel: 1 }, cost: { steel: 150 } },
  { id: "artyLine", name: "Artillery Line", out: "artillery", outName: "Artillery", rate: 0.2, cons: { steel: 2 }, cost: { steel: 450 } },
  { id: "tankLine", name: "Tank Line", out: "tanks", outName: "Tanks", rate: 0.1, cons: { steel: 3, rubber: 0.3 }, cost: { steel: 1200, rubber: 80 } },
  { id: "fighterLine", name: "Fighter Line", out: "fighters", outName: "Fighters", rate: 0.1, cons: { alu: 2, rubber: 0.3 }, cost: { steel: 1000, alu: 150 } },
  { id: "shipyard", name: "Shipyard", out: "ships", outName: "Warships", rate: 0.05, cons: { steel: 5, oil: 0.5 }, cost: { steel: 2600 } },
];

export const FORCES = [
  { id: "inf", name: "Infantry Division", icon: "🪖", cost: { rifles: 40, artillery: 10, manpower: 80 } },
  { id: "arm", name: "Armoured Division", icon: "🚜", cost: { tanks: 15, artillery: 5, manpower: 40 } },
  { id: "air", name: "Air Wing", icon: "✈️", cost: { fighters: 12, manpower: 30 }, upkeep: "0.2 oil/s" },
  { id: "fleet", name: "Fleet", icon: "⚓", cost: { ships: 5, manpower: 60 }, upkeep: "0.4 oil/s" },
];

export const THEATRES = [
  { id: "bob", name: "Battle of Britain", icon: "✈️", dur: 90, need: (st) => ({ air: 2 * st }), reward: "+15% steel & aluminium output per victory", air: true },
  { id: "atlantic", name: "Battle of the Atlantic", icon: "⚓", dur: 120, need: (st) => ({ fleet: 2 * st }), reward: "+0.5 oil & rubber/sec convoys per victory", naval: true },
  { id: "africa", name: "North Africa", icon: "🏜️", dur: 150, need: (st) => ({ inf: 3 * st, arm: 1 * st }), reward: "+1 oil/sec Middle East fields per victory" },
];

export const UPGRADES = [
  { id: "shift", name: "Shift Work", desc: "Foundry taps produce 3× steel", cost: { steel: 300 } },
  { id: "radar", name: "Radar Network", desc: "Air & naval theatres resolve 25% faster", ws: 3 },
  { id: "law1", name: "Limited Conscription", desc: "Manpower growth ×2", ws: 2 },
  { id: "law2", name: "Extensive Conscription", desc: "Manpower growth ×4", ws: 6, req: "law1" },
  { id: "law3", name: "Service by Requirement", desc: "Manpower growth ×8", ws: 15, req: "law2" },
];

export const FRESH = {
  res: { steel: 0, alu: 0, oil: 0, rubber: 0, manpower: 0 },
  eq: { rifles: 0, artillery: 0, tanks: 0, fighters: 0, ships: 0 },
  owned: {}, upgrades: {}, forces: {}, stages: {}, missions: [], warScore: 0, taps: 0,
};
