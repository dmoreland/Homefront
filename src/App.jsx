import { useGameEngine } from "./hooks/useGameEngine.js";
import { Header } from "./components/Header.jsx";
import { Scene } from "./components/Scene.jsx";
import { ResourceBar } from "./components/ResourceBar.jsx";
import { Foundry } from "./components/Foundry.jsx";
import { GeneratorList } from "./components/GeneratorList.jsx";
import { ProductionLines } from "./components/ProductionLines.jsx";
import { ForcesList } from "./components/ForcesList.jsx";
import { Theatres } from "./components/Theatres.jsx";
import { WarCabinet } from "./components/WarCabinet.jsx";
import { Footer } from "./components/Footer.jsx";
import { Toast } from "./components/Toast.jsx";

// HOME FRONT — a WW2 industrial idle game (v1: United Kingdom).
// State and simulation live in useGameEngine; this component just composes the UI.
export default function App() {
  const { game, sim, now, toast, actions } = useGameEngine();

  return (
    <div style={{ minHeight: "100vh", background: "#16222E", color: "#EDE6D3", fontFamily: "'Trebuchet MS','Segoe UI',sans-serif", paddingBottom: 32 }}>
      <Header warScore={game.warScore} />
      <Scene owned={game.owned} forces={game.forces} />

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 14px" }}>
        <ResourceBar res={game.res} net={sim.net} />
        <Foundry shift={game.upgrades.shift} onTap={actions.tap} />
        <GeneratorList owned={game.owned} res={game.res} onBuy={actions.buyGen} />
        <ProductionLines owned={game.owned} res={game.res} eq={game.eq} lineStatus={sim.lineStatus} onBuy={actions.buyGen} />
        <ForcesList res={game.res} eq={game.eq} forces={game.forces} onRecruit={actions.recruit} />
        <Theatres stages={game.stages} missions={game.missions} forces={game.forces} upgrades={game.upgrades} now={now} onLaunch={actions.launch} />
        <WarCabinet res={game.res} warScore={game.warScore} upgrades={game.upgrades} onBuy={actions.buyUpgrade} />
        <Footer onReset={actions.reset} />
      </div>

      <Toast message={toast} />
    </div>
  );
}
