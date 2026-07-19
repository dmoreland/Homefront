// Themeable icons from game-icons.net (CC BY 3.0 — Lorc, Delapouite, sbed).
// SVGs are bundled locally, background-stripped, and filled with currentColor.
import steel from "../assets/icons/steel.svg?raw";
import alu from "../assets/icons/alu.svg?raw";
import oil from "../assets/icons/oil.svg?raw";
import rubber from "../assets/icons/rubber.svg?raw";
import manpower from "../assets/icons/manpower.svg?raw";
import factory from "../assets/icons/factory.svg?raw";
import refinery from "../assets/icons/refinery.svg?raw";
import civ from "../assets/icons/civ.svg?raw";
import synth from "../assets/icons/synth.svg?raw";
import rifle from "../assets/icons/rifle.svg?raw";
import artillery from "../assets/icons/artillery.svg?raw";
import tank from "../assets/icons/tank.svg?raw";
import fighter from "../assets/icons/fighter.svg?raw";
import ship from "../assets/icons/ship.svg?raw";
import helmet from "../assets/icons/helmet.svg?raw";
import anchor from "../assets/icons/anchor.svg?raw";
import battle from "../assets/icons/battle.svg?raw";
import desert from "../assets/icons/desert.svg?raw";
import winter from "../assets/icons/winter.svg?raw";

const ICONS = {
  steel, alu, oil, rubber, manpower,
  factory, refinery, civ, synth,
  rifle, artillery, tank, fighter, ship, helmet, anchor,
  battle, desert, winter,
};

// Theatre cards keep a thematic emoji in their data; map it to a game-icon.
export const THEATRE_ICON = { "✈️": "fighter", "⚓": "anchor", "🏜️": "desert", "⚔️": "battle", "❄️": "winter", "🚜": "tank" };

// Maps from game ids/keys to icon names.
export const RES_ICON = { steel: "steel", alu: "alu", oil: "oil", rubber: "rubber", manpower: "manpower" };
export const EQUIP_ICON = { rifles: "rifle", artillery: "artillery", tanks: "tank", fighters: "fighter", ships: "ship" };
export const GEN_ICON = { mill: "factory", smelter: "alu", refinery: "refinery", plantation: "rubber", civ: "civ", synth: "synth" };
export const FORCE_ICON = { inf: "helmet", arm: "tank", air: "fighter", fleet: "anchor" };

// Inline, themeable icon. `color` flows to the SVG via currentColor.
export function GIcon({ name, size = 18, color = "currentColor", style }) {
  const raw = ICONS[name];
  if (!raw) return null;
  const svg = raw.replace("<svg ", '<svg width="100%" height="100%" ');
  return (
    <span aria-hidden="true" style={{ display: "inline-block", width: size, height: size, color, lineHeight: 0, verticalAlign: "middle", flex: "0 0 auto", ...style }} dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
