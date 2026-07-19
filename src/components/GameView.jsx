import { Header } from "./Header.jsx";
import { Scene } from "./Scene.jsx";
import { ResourceBar } from "./ResourceBar.jsx";
import { PrestigeBanner } from "./PrestigeBanner.jsx";
import { Foundry } from "./Foundry.jsx";
import { GeneratorList } from "./GeneratorList.jsx";
import { ProductionLines } from "./ProductionLines.jsx";
import { ForcesList } from "./ForcesList.jsx";
import { Theatres } from "./Theatres.jsx";
import { WarCabinet } from "./WarCabinet.jsx";
import { Footer } from "./Footer.jsx";

// The active-campaign UI, composed from the nation config, doctrine mods, and
// engine state. Presentational: everything arrives via props (App holds the engine).
export function GameView({ nation, game, sim, mods, now, canPrestige, prestigeAward, fuelStarved, actions }) {
  const shift = nation.upgrades.find((u) => u.tapMult && game.upgrades[u.id]);
  const perTap = (nation.tapBase || 2) * (shift ? shift.tapMult : 1) * mods.tapMult;

  return (
    <div style={{ minHeight: "100vh", background: "#16222E", color: "#EDE6D3", fontFamily: "'Trebuchet MS','Segoe UI',sans-serif", paddingBottom: 32 }}>
      <Header nation={nation} warScore={game.warScore} />
      <Scene owned={game.owned} forces={game.forces} theme={nation.theme} />

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 14px" }}>
        {canPrestige && <PrestigeBanner award={prestigeAward} onPrestige={actions.prestige} />}
        <ResourceBar res={game.res} net={sim.net} />
        <Foundry perTap={perTap} onTap={actions.tap} />
        <GeneratorList generators={nation.generators} owned={game.owned} res={game.res} onBuy={actions.buyGen} />
        <ProductionLines owned={game.owned} res={game.res} eq={game.eq} lineStatus={sim.lineStatus} onBuy={actions.buyGen} />
        <ForcesList nation={nation} forces={nation.forces} res={game.res} eq={game.eq} owned={game.forces} readiness={game.readiness} mods={mods} onRecruit={actions.recruit} onMobilise={actions.mobilise} />
        <Theatres nation={nation} stages={game.stages} missions={game.missions} forces={game.forces} readiness={game.readiness} upgrades={game.upgrades} mods={mods} fuelStarved={fuelStarved} now={now} onLaunch={actions.launch} />
        <WarCabinet upgrades={nation.upgrades} res={game.res} warScore={game.warScore} owned={game.upgrades} onBuy={actions.buyUpgrade} />
        <Footer onReset={actions.reset} />
      </div>
    </div>
  );
}
