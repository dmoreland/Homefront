import { useGameEngine } from "./hooks/useGameEngine.js";
import { NATIONS } from "./data/nations.js";
import { NationPicker } from "./components/NationPicker.jsx";
import { DoctrineHQ } from "./components/DoctrineHQ.jsx";
import { GameView } from "./components/GameView.jsx";
import { Toast } from "./components/Toast.jsx";

// HOME FRONT — a WW2 industrial idle game.
// State and simulation live in useGameEngine. This component routes between the
// active campaign, the nation-selection screen, and the doctrine HQ.
export default function App() {
  const { game, nation, sim, mods, now, toast, doctrines, metaScreen, canPrestige, prestigeAward, actions } = useGameEngine();

  let screen;
  if (nation) {
    screen = <GameView nation={nation} game={game} sim={sim} mods={mods} now={now} canPrestige={canPrestige} prestigeAward={prestigeAward} actions={actions} />;
  } else if (metaScreen === "hq") {
    screen = <DoctrineHQ doctrines={doctrines} onBuy={actions.buyDoctrine} onBack={actions.closeDoctrines} />;
  } else {
    screen = <NationPicker nations={NATIONS} doctrinePoints={doctrines.points} onSelect={actions.selectNation} onOpenDoctrines={actions.openDoctrines} />;
  }

  return (
    <>
      {screen}
      <Toast message={toast} />
    </>
  );
}
