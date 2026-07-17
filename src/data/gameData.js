// =====================================================
// HOME FRONT — shared data tables
// These are universal across nations. Nation-specific content
// (generators, forces, theatres, upgrades, passive trickle) lives
// in src/data/nations.js. Nations reuse the same resource set, the
// same production-line chain, and the same equipment/force id slots.
// =====================================================

// The five raw resources. Universal.
export const RES = [
  { key: "steel", label: "Steel", icon: "⚙️", color: "#B8C4CE" },
  { key: "alu", label: "Aluminium", icon: "🧱", color: "#9FB4C7" },
  { key: "oil", label: "Oil", icon: "🛢️", color: "#C9A227" },
  { key: "rubber", label: "Rubber", icon: "🛞", color: "#8FA37A" },
  { key: "manpower", label: "Manpower", icon: "👥", color: "#D9B14B" },
];

// Production lines: the shared two-stage chain (resources -> equipment).
// Every nation builds the same equipment types from the same lines; the
// asymmetry lives upstream (generators/trickle) and downstream (forces/theatres).
export const LINES = [
  { id: "rifleLine", name: "Rifle Line", out: "rifles", outName: "Rifles", rate: 0.5, cons: { steel: 1 }, cost: { steel: 150 } },
  { id: "artyLine", name: "Artillery Line", out: "artillery", outName: "Artillery", rate: 0.2, cons: { steel: 2 }, cost: { steel: 450 } },
  { id: "tankLine", name: "Tank Line", out: "tanks", outName: "Tanks", rate: 0.1, cons: { steel: 3, rubber: 0.3 }, cost: { steel: 1200, rubber: 80 } },
  { id: "fighterLine", name: "Fighter Line", out: "fighters", outName: "Fighters", rate: 0.1, cons: { alu: 2, rubber: 0.3 }, cost: { steel: 1000, alu: 150 } },
  { id: "shipyard", name: "Shipyard", out: "ships", outName: "Warships", rate: 0.05, cons: { steel: 5, oil: 0.5 }, cost: { steel: 2600 } },
];

// Fresh-campaign template. `nationId: null` means no campaign chosen yet
// (the app shows the nation picker). newGame() in nations.js fills it in.
export const FRESH = {
  nationId: null,
  res: { steel: 0, alu: 0, oil: 0, rubber: 0, manpower: 0 },
  eq: { rifles: 0, artillery: 0, tanks: 0, fighters: 0, ships: 0 },
  owned: {}, upgrades: {}, forces: {}, stages: {}, missions: [], warScore: 0, taps: 0,
};
