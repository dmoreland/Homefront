// National flag banners (public-domain SVGs; Germany = modern tricolour, USSR =
// a generic red-and-star banner). Used on the picker cards.
import uk from "../assets/flags/uk.svg";
import usa from "../assets/flags/usa.svg";
import france from "../assets/flags/france.svg";
import germany from "../assets/flags/germany.svg";
import italy from "../assets/flags/italy.svg";
import japan from "../assets/flags/japan.svg";
import ussr from "../assets/flags/ussr.svg";

const FLAGS = { uk, usa, france, germany, italy, japan, ussr };

export function Flag({ nation, width = 44, style }) {
  const src = FLAGS[nation];
  if (!src) return null;
  return <img src={src} alt="" width={width} style={{ display: "block", borderRadius: 3, border: "1px solid #00000033", ...style }} />;
}
