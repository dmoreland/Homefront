// Animated blackout skyline: factories appear with industry, Spitfires with
// air wings, the fleet in the Channel. Purely a reflection of game state.
export function Scene({ owned, forces }) {
  const airCount = Math.min(3, forces.air || 0);
  const fleetCount = Math.min(3, forces.fleet || 0);
  const factoryCount = Math.min(4, (owned.mill || 0) + (owned.civ || 0));

  return (
    <svg viewBox="0 0 100 36" style={{ width: "100%", display: "block", marginTop: 4 }} preserveAspectRatio="xMidYMax meet">
      <rect x="0" y="0" width="100" height="36" fill="#0E1822" />
      <circle cx="86" cy="6" r="2.6" fill="#EDE6D3" opacity="0.85" />
      {/* land + white cliffs + sea */}
      <path d="M0,36 L0,24 L62,24 L62,28 L64,28 L64,36 Z" fill="#1C2B3A" />
      <rect x="62" y="24" width="2.2" height="6" fill="#D8D4C4" />
      <rect x="64" y="29" width="36" height="7" fill="#132534" />
      <path d="M64,29.5 Q75,28.8 86,29.5 T100,29.3" stroke="#2E4B63" strokeWidth="0.5" fill="none" />
      {/* factories appear with industry */}
      {Array.from({ length: factoryCount }).map((_, i) => {
        const x = 6 + i * 12;
        return (
          <g key={i}>
            <rect x={x} y="19" width="8" height="5" fill="#26394E" />
            <path d={`M${x},19 L${x + 2.6},17.3 L${x + 2.6},19 L${x + 5.3},17.3 L${x + 5.3},19 L${x + 8},17.3 L${x + 8},19`} fill="#26394E" />
            <rect x={x + 6.4} y="13.5" width="1.1" height="5.5" fill="#31465C" />
            <circle cx={x + 7} cy="12.6" r="0.9" fill="#4A6076" opacity="0.5">
              <animate attributeName="cy" values="12.6;10.8;12.6" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="4s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
      {/* barrage balloons */}
      {[{ x: 18, y: 7 }, { x: 44, y: 5 }].map((b, i) => (
        <g key={i}>
          <ellipse cx={b.x} cy={b.y} rx="3" ry="1.7" fill="#7E96AC" opacity="0.8">
            <animate attributeName="cy" values={`${b.y};${b.y - 0.6};${b.y}`} dur={`${6 + i * 2}s`} repeatCount="indefinite" />
          </ellipse>
          <line x1={b.x} y1={b.y + 1.5} x2={b.x - 2} y2="24" stroke="#4A6076" strokeWidth="0.15" />
        </g>
      ))}
      {/* Spitfires when you have air wings */}
      {Array.from({ length: airCount }).map((_, i) => (
        <g key={i}>
          <path d="M-1.4,0 L1.4,0 M0,-0.9 L0,0.5 M-0.5,0.9 L0.5,0.9" stroke="#D9B14B" strokeWidth="0.4" />
          <animateMotion dur={`${11 + i * 4}s`} begin={`${-i * 5}s`} repeatCount="indefinite" path="M-4,10 Q30,7 60,11 T104,9" />
        </g>
      ))}
      {/* fleet in the Channel */}
      {Array.from({ length: fleetCount }).map((_, i) => {
        const x = 70 + i * 10;
        return (
          <g key={i}>
            <path d={`M${x},31 L${x + 6},31 L${x + 5},32.6 L${x + 1},32.6 Z`} fill="#3A5570" />
            <rect x={x + 2.4} y="29.6" width="1.2" height="1.4" fill="#3A5570" />
            <animateTransform attributeName="transform" type="translate" values="0,0;0,0.35;0,0" dur={`${3 + i}s`} repeatCount="indefinite" />
          </g>
        );
      })}
    </svg>
  );
}
