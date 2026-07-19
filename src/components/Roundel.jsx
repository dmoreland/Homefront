// Nation roundels — period military insignia drawn as inline SVG. Deliberately
// generic (no swastika, no hammer-and-sickle): RAF/US/French/Italian roundels,
// the Japanese Hinomaru, a plain German Balkenkreuz cross, and a Soviet red star.
const STAR = "12,3 14.18,9.01 20.56,9.22 15.52,13.14 17.29,19.28 12,15.7 6.71,19.28 8.48,13.14 3.44,9.22 9.82,9.01";

export function Roundel({ nation, size = 20, title }) {
  const wrap = (children) => (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "inline-block", verticalAlign: "middle", flex: "0 0 auto" }} role="img" aria-label={title || `${nation} insignia`}>
      {children}
    </svg>
  );
  switch (nation) {
    case "uk": // RAF roundel: blue / white / red
      return wrap(<><circle cx="12" cy="12" r="11" fill="#1B4B8F" /><circle cx="12" cy="12" r="7" fill="#EDE6D3" /><circle cx="12" cy="12" r="3.5" fill="#C8102E" /></>);
    case "france": // cockade: red / white / blue (reverse of RAF)
      return wrap(<><circle cx="12" cy="12" r="11" fill="#C8102E" /><circle cx="12" cy="12" r="7" fill="#EDE6D3" /><circle cx="12" cy="12" r="3.5" fill="#1B4B8F" /></>);
    case "italy": // green / white / red
      return wrap(<><circle cx="12" cy="12" r="11" fill="#0B8A3D" /><circle cx="12" cy="12" r="7" fill="#EDE6D3" /><circle cx="12" cy="12" r="3.5" fill="#CD212A" /></>);
    case "usa": // star on blue disc
      return wrap(<><circle cx="12" cy="12" r="11" fill="#1B3A6B" /><polygon points={STAR} fill="#EDE6D3" /></>);
    case "japan": // Hinomaru disc
      return wrap(<circle cx="12" cy="12" r="10.5" fill="#BC002D" />);
    case "ussr": // red star
      return wrap(<polygon points={STAR} fill="#C0272D" stroke="#7C1A1E" strokeWidth="0.6" strokeLinejoin="round" />);
    case "germany": // Balkenkreuz: white-edged black cross
      return wrap(<>
        <rect x="8" y="1.5" width="8" height="21" fill="#EDE6D3" />
        <rect x="1.5" y="8" width="21" height="8" fill="#EDE6D3" />
        <rect x="9.3" y="2.8" width="5.4" height="18.4" fill="#161616" />
        <rect x="2.8" y="9.3" width="18.4" height="5.4" fill="#161616" />
      </>);
    default:
      return null;
  }
}
