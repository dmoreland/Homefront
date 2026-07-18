import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App.jsx";
import { GameView } from "./components/GameView.jsx";
import { DoctrineHQ } from "./components/DoctrineHQ.jsx";
import { getNation, newGame } from "./data/nations.js";
import { simulate } from "./game/simulate.js";
import { computeMods } from "./game/doctrines.js";

const noop = () => {};
const actions = {
  selectNation: noop, tap: noop, buyGen: noop, recruit: noop, buyUpgrade: noop, launch: noop,
  reset: noop, prestige: noop, buyDoctrine: noop, openDoctrines: noop, closeDoctrines: noop,
};

describe("App smoke render", () => {
  it("shows the nation picker (with Doctrine HQ link) when no campaign is loaded", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("HOME FRONT");
    expect(html).toContain("Choose your nation");
    expect(html).toContain("United Kingdom");
    expect(html).toContain("Germany");
    expect(html).toContain("Doctrine HQ");
  });
});

describe("GameView smoke render — Germany", () => {
  const nation = getNation("germany");
  const game = newGame(nation);
  const mods = computeMods({});
  const sim = simulate(game, 1, nation, mods);
  const html = renderToStaticMarkup(
    <GameView nation={nation} game={game} sim={sim} mods={mods} now={Date.now()} canPrestige={false} prestigeAward={0} actions={actions} />,
  );

  it("renders the German forces, industry, and theatres", () => {
    expect(html).toContain("Wehrmacht Infantry");
    expect(html).toContain("Panzer Division");
    expect(html).toContain("Luftwaffe Wing");
    expect(html).toContain("Kriegsmarine Fleet");
    expect(html).toContain("Synthetic Refinery");
    expect(html).toContain("Fall Gelb");
    expect(html).toContain("WORK THE FOUNDRY");
  });

  it("uses only service-branch forces — no SS or political units", () => {
    expect(html).not.toMatch(/\bSS\b/);
    expect(html).not.toMatch(/Waffen/i);
    expect(html).not.toMatch(/Gestapo/i);
  });

  it("shows the prestige banner only at Total Victory", () => {
    const won = { ...game, stages: { fallgelb: 3, east: 3, uboat: 3 }, warTotal: 18 };
    const html2 = renderToStaticMarkup(
      <GameView nation={nation} game={won} sim={simulate(won, 1, nation, mods)} mods={mods} now={Date.now()} canPrestige prestigeAward={6} actions={actions} />,
    );
    expect(html).not.toContain("TOTAL VICTORY");
    expect(html2).toContain("TOTAL VICTORY");
    expect(html2).toContain("PRESTIGE");
  });

  it("shows the fuel-shortage warning on an active air/naval op only when starved", () => {
    const withOp = { ...game, missions: [{ theatre: "uboat", stage: 1, forces: { fleet: 2 }, endsAt: Date.now() + 60_000 }] };
    const render = (starved) => renderToStaticMarkup(
      <GameView nation={nation} game={withOp} sim={simulate(withOp, 1, nation, mods)} mods={mods} now={Date.now()} canPrestige={false} prestigeAward={0} fuelStarved={starved} actions={actions} />,
    );
    expect(render(true)).toContain("Fuel shortage");
    expect(render(false)).not.toContain("Fuel shortage");
  });
});

describe("DoctrineHQ smoke render", () => {
  it("renders all four branches and node costs", () => {
    const html = renderToStaticMarkup(
      <DoctrineHQ doctrines={{ points: 5, purchased: { eco_steel: true } }} onBuy={noop} onBack={noop} />,
    );
    expect(html).toContain("DOCTRINE HQ");
    expect(html).toContain("WAR ECONOMY");
    expect(html).toContain("LAND");
    expect(html).toContain("SEA");
    expect(html).toContain("AIR");
    expect(html).toContain("Rationalised Production");
    expect(html).toContain("Adopted"); // eco_steel is owned
    expect(html).toContain("doctrine points available");
  });
});
