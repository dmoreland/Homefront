import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App.jsx";
import { GameView } from "./components/GameView.jsx";
import { getNation, newGame } from "./data/nations.js";
import { simulate } from "./game/simulate.js";

const noop = () => {};
const actions = { selectNation: noop, tap: noop, buyGen: noop, recruit: noop, buyUpgrade: noop, launch: noop, reset: noop };

describe("App smoke render", () => {
  it("shows the nation picker when no campaign is loaded", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("HOME FRONT");
    expect(html).toContain("Choose your nation");
    expect(html).toContain("United Kingdom");
    expect(html).toContain("Germany");
  });
});

describe("GameView smoke render — Germany", () => {
  const nation = getNation("germany");
  const game = newGame(nation);
  const sim = simulate(game, 1, nation);
  const html = renderToStaticMarkup(<GameView nation={nation} game={game} sim={sim} now={Date.now()} actions={actions} />);

  it("renders the German forces, industry, and theatres", () => {
    expect(html).toContain("HOME FRONT");
    expect(html).toContain("Wehrmacht Infantry");
    expect(html).toContain("Panzer Division");
    expect(html).toContain("Luftwaffe Wing");
    expect(html).toContain("Kriegsmarine Fleet");
    expect(html).toContain("Synthetic Refinery");
    expect(html).toContain("Fall Gelb");
    expect(html).toContain("Eastern Front");
    expect(html).toContain("Atlantic U-boats");
    expect(html).toContain("WORK THE FOUNDRY");
  });

  it("uses only service-branch forces — no SS or political units", () => {
    expect(html).not.toMatch(/\bSS\b/);
    expect(html).not.toMatch(/Waffen/i);
    expect(html).not.toMatch(/Gestapo/i);
  });
});
