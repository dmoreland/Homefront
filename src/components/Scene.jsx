// Animated blackout skyline: a live reflection of what you've built. Factories
// rise with industry, tanks & infantry muster on the land as you raise divisions,
// aircraft patrol the sky with your air wings, and the fleet stands out to sea.
// The silhouettes are the game-icons.net SVGs (CC BY 3.0), tinted from the active
// nation's `theme` so each nation reads differently.
import factoryIcon from "../assets/icons/factory.svg?raw";
import refineryIcon from "../assets/icons/refinery.svg?raw";
import fighterIcon from "../assets/icons/fighter.svg?raw";
import shipIcon from "../assets/icons/ship.svg?raw";
import tankIcon from "../assets/icons/tank.svg?raw";
import helmetIcon from "../assets/icons/helmet.svg?raw";

// UK palette — also the fallback when a nation omits fields.
const DEFAULT_THEME = {
  sky: "#0E1822", moon: "#EDE6D3",
  land: "#1C2B3A", cliff: "#D8D4C4", // white cliffs of Dover; null = plain coast
  sea: "#132534", wave: "#2E4B63",
  factory: "#26394E", chimney: "#31465C", smoke: "#4A6076",
  plane: "#D9B14B", ship: "#3A5570",
  balloons: true,
};

const innerSvg = (raw) => raw.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

// A game-icon embedded in the scene at (x,y), sized to `size` units, tinted via
// currentColor. The source paths use fill="currentColor", so `color` recolours them.
function Emblem({ raw, x, y, size, color, opacity = 1 }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 512 512" opacity={opacity}
      style={{ color }} dangerouslySetInnerHTML={{ __html: innerSvg(raw) }} />
  );
}

export function Scene({ owned, forces, theme }) {
  const t = { ...DEFAULT_THEME, ...theme };
  const airCount = Math.min(3, forces.air || 0);
  const fleetCount = Math.min(3, forces.fleet || 0);

  // Industry silhouettes: factories for mills/civ, plus a refinery if the nation
  // is making its own fuel (Synthetic Refinery / oil). Capped so the skyline fits.
  const industry = (owned.mill || 0) + (owned.civ || 0);
  const buildings = [];
  for (let i = 0; i < Math.min(4, industry); i++) buildings.push(factoryIcon);
  if ((owned.synth || owned.refinery) && buildings.length < 4) buildings.push(refineryIcon);

  // Land forces mustering on the home front: tanks for armour, helmets for infantry.
  const land = [];
  for (let i = 0; i < Math.min(2, forces.arm || 0); i++) land.push(tankIcon);
  for (let i = 0; i < Math.min(2, forces.inf || 0); i++) land.push(helmetIcon);

  return (
    <svg viewBox="0 0 100 36" style={{ width: "100%", display: "block", marginTop: 4 }} preserveAspectRatio="xMidYMax meet">
      <rect x="0" y="0" width="100" height="36" fill={t.sky} />
      <circle cx="86" cy="6" r="2.6" fill={t.moon} opacity="0.85" />
      {/* land + coastline + sea */}
      <path d="M0,36 L0,24 L62,24 L62,28 L64,28 L64,36 Z" fill={t.land} />
      {t.cliff && <rect x="62" y="24" width="2.2" height="6" fill={t.cliff} />}
      <rect x="64" y="29" width="36" height="7" fill={t.sea} />
      <path d="M64,29.5 Q75,28.8 86,29.5 T100,29.3" stroke={t.wave} strokeWidth="0.5" fill="none" />

      {/* factories / refineries rise from the land as industry grows */}
      {buildings.map((raw, i) => {
        const x = 4 + i * 13;
        return (
          <g key={i}>
            <Emblem raw={raw} x={x} y={14.5} size={9.5} color={t.chimney} />
            <circle cx={x + 7} cy="13" r="0.9" fill={t.smoke} opacity="0.5">
              <animate attributeName="cy" values="13;11;13" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="4s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}

      {/* land forces muster in the foreground as you raise divisions */}
      {land.map((raw, i) => (
        <Emblem key={i} raw={raw} x={7 + i * 10.5} y={26.5} size={5.5} color={t.smoke} />
      ))}

      {/* barrage balloons (defensive — nations that flew them) */}
      {t.balloons && [{ x: 20, y: 7 }, { x: 46, y: 5 }].map((b, i) => (
        <g key={i}>
          <ellipse cx={b.x} cy={b.y} rx="3" ry="1.7" fill="#7E96AC" opacity="0.8">
            <animate attributeName="cy" values={`${b.y};${b.y - 0.6};${b.y}`} dur={`${6 + i * 2}s`} repeatCount="indefinite" />
          </ellipse>
          <line x1={b.x} y1={b.y + 1.5} x2={b.x - 2} y2="24" stroke="#4A6076" strokeWidth="0.15" />
        </g>
      ))}

      {/* aircraft patrol the sky with your air wings */}
      {Array.from({ length: airCount }).map((_, i) => (
        <g key={i}>
          <Emblem raw={fighterIcon} x={-3} y={-3} size={6} color={t.plane} />
          <animateMotion dur={`${12 + i * 4}s`} begin={`${-i * 5}s`} repeatCount="indefinite" path="M-6,10 Q30,6 60,11 T108,9" />
        </g>
      ))}

      {/* fleet stands out to sea */}
      {Array.from({ length: fleetCount }).map((_, i) => {
        const x = 66 + i * 10;
        return (
          <g key={i}>
            <Emblem raw={shipIcon} x={x} y={28.5} size={7} color={t.ship} />
            <animateTransform attributeName="transform" type="translate" values="0,0;0,0.4;0,0" dur={`${3 + i}s`} repeatCount="indefinite" />
          </g>
        );
      })}
    </svg>
  );
}
