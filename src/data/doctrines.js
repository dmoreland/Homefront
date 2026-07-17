// =====================================================
// DOCTRINES — permanent, cross-run meta-progression (shared across nations).
// Earn Doctrine Points by prestiging (Total Victory), spend them in the four
// branches below. Effects are typed data applied by game/doctrines.js:
//   genMult:    { res: "steel" | ["oil","rubber"] | "all", mult }  // resource output
//   startBonus: { res: { steel: 250 } }                            // stockpile at run start
//   offlineRate:{ add: 0.2 }                                       // +offline production rate
//   forceCost:  { target: "inf", mult: 0.8 }                       // cheaper units
//   upkeep:     { target: "fleet" | "all", mult: 0.5 }             // lower oil upkeep
//   stageReq:   { delta: -1 }                                      // easier theatre requirements
//   opSpeed:    { mult: 0.75 }                                     // faster air/naval ops
//   tapMult:    { mult: 2 }                                        // stronger foundry taps
// =====================================================

export const PRESTIGE_STAGE = 3; // every theatre must reach this many victories
export const PRESTIGE_K = 1.5; // doctrine points = floor(K * sqrt(warTotal))

export const BRANCHES = [
  { id: "economy", name: "War Economy", icon: "🏭", blurb: "Out-produce the enemy." },
  { id: "land", name: "Land", icon: "⚔️", blurb: "Cheaper, faster armies." },
  { id: "sea", name: "Sea", icon: "⚓", blurb: "Sustainable fleets." },
  { id: "air", name: "Air", icon: "✈️", blurb: "Command the skies." },
];

export const DOCTRINES = [
  // 🏭 War Economy — the resource-generation branch
  { id: "eco_steel", branch: "economy", name: "Rationalised Production", cost: 1, desc: "Steel output +15%", effect: { kind: "genMult", res: "steel", mult: 1.15 } },
  { id: "eco_fuel", branch: "economy", name: "Fuel Synthesis", cost: 2, desc: "Oil & rubber output +25%", effect: { kind: "genMult", res: ["oil", "rubber"], mult: 1.25 } },
  { id: "eco_all", branch: "economy", name: "Total War Economy", cost: 4, req: "eco_steel", desc: "All resource output +10%", effect: { kind: "genMult", res: "all", mult: 1.1 } },
  { id: "eco_reserve", branch: "economy", name: "Strategic Reserves", cost: 2, desc: "Start each run with 250 steel", effect: { kind: "startBonus", res: { steel: 250 } } },
  { id: "eco_offline", branch: "economy", name: "Automated Foundries", cost: 3, desc: "Offline production 50% → 70%", effect: { kind: "offlineRate", add: 0.2 } },

  // ⚔️ Land
  { id: "land_inf", branch: "land", name: "Grand Battleplan", cost: 2, desc: "Infantry cost −20%", effect: { kind: "forceCost", target: "inf", mult: 0.8 } },
  { id: "land_arm", branch: "land", name: "Mobile Warfare", cost: 2, desc: "Armour cost −20%", effect: { kind: "forceCost", target: "arm", mult: 0.8 } },
  { id: "land_req", branch: "land", name: "Overwhelming Force", cost: 4, req: "land_inf", desc: "Theatre force requirements −1", effect: { kind: "stageReq", delta: -1 } },

  // ⚓ Sea
  { id: "sea_upkeep", branch: "sea", name: "Convoy Escorts", cost: 2, desc: "Fleet oil upkeep −50%", effect: { kind: "upkeep", target: "fleet", mult: 0.5 } },
  { id: "sea_cost", branch: "sea", name: "Naval Yards", cost: 2, desc: "Fleet cost −20%", effect: { kind: "forceCost", target: "fleet", mult: 0.8 } },

  // ✈️ Air
  { id: "air_speed", branch: "air", name: "Air Superiority", cost: 2, desc: "Air & naval operations 25% faster", effect: { kind: "opSpeed", mult: 0.75 } },
  { id: "air_cost", branch: "air", name: "Aircraft Mass Production", cost: 2, desc: "Air wing cost −20%", effect: { kind: "forceCost", target: "air", mult: 0.8 } },
];
