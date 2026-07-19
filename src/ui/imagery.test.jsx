import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GIcon, RES_ICON, FORCE_ICON, THEATRE_ICON } from "./Icon.jsx";
import { Roundel } from "../components/Roundel.jsx";
import { Flag } from "../components/Flag.jsx";
import { NATIONS } from "../data/nations.js";

describe("GIcon", () => {
  it("renders a themeable inline svg for a known icon", () => {
    const html = renderToStaticMarkup(<GIcon name="tank" size={20} color="#fff" />);
    expect(html).toContain("<svg");
    expect(html).toContain("currentColor"); // themeable fill
  });

  it("renders nothing for an unknown icon", () => {
    expect(renderToStaticMarkup(<GIcon name="does-not-exist" />)).toBe("");
  });

  it("has an icon mapping for every resource and force id", () => {
    for (const k of ["steel", "alu", "oil", "rubber", "manpower"]) expect(RES_ICON[k]).toBeTruthy();
    for (const k of ["inf", "arm", "air", "fleet"]) expect(FORCE_ICON[k]).toBeTruthy();
  });

  it("maps every theatre's emoji to a game-icon across all nations", () => {
    for (const n of NATIONS) for (const t of n.theatres) expect(THEATRE_ICON[t.icon], `${n.id}/${t.id} (${t.icon})`).toBeTruthy();
  });
});

describe("Roundel", () => {
  it("draws distinct insignia per nation (no shared markup)", () => {
    expect(renderToStaticMarkup(<Roundel nation="uk" />)).toContain("#1B4B8F"); // RAF blue
    expect(renderToStaticMarkup(<Roundel nation="japan" />)).toContain("#BC002D"); // hinomaru red
    expect(renderToStaticMarkup(<Roundel nation="germany" />)).toContain("#161616"); // balkenkreuz cross
  });

  it("renders a roundel for every nation", () => {
    for (const n of NATIONS) expect(renderToStaticMarkup(<Roundel nation={n.id} />)).toContain("<svg");
  });
});

describe("Flag", () => {
  it("renders an img for every nation", () => {
    for (const n of NATIONS) {
      const html = renderToStaticMarkup(<Flag nation={n.id} />);
      expect(html).toContain("<img");
      expect(html).toContain("src=");
    }
  });
});
