import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Scene } from "./Scene.jsx";
import { getNation } from "../data/nations.js";

const owned = { mill: 2 };
const forces = { air: 2, fleet: 2 };
const render = (nation) => renderToStaticMarkup(<Scene owned={owned} forces={forces} theme={getNation(nation).theme} />);

describe("Scene theming", () => {
  it("draws the UK with white Dover cliffs, barrage balloons, and gold aircraft", () => {
    const html = render("uk");
    expect(html).toContain("#D8D4C4"); // white cliff
    expect(html).toContain("#7E96AC"); // barrage balloon
    expect(html).toContain("#D9B14B"); // gold aircraft
  });

  it("draws Germany with no Dover cliffs, no balloons, and grey Luftwaffe aircraft", () => {
    const html = render("germany");
    expect(html).toContain("#AEB9C4"); // grey aircraft
    expect(html).not.toContain("#D8D4C4"); // no white cliffs
    expect(html).not.toContain("#7E96AC"); // no barrage balloons
  });

  it("falls back to the default palette when a theme is omitted", () => {
    const html = renderToStaticMarkup(<Scene owned={owned} forces={forces} />);
    expect(html).toContain("#D9B14B"); // default (UK) aircraft colour
  });
});
