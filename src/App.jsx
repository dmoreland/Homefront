import { useGameEngine } from "./hooks/useGameEngine.js";
import { NATIONS } from "./data/nations.js";
import { NationPicker } from "./components/NationPicker.jsx";
import { GameView } from "./components/GameView.jsx";
import { Toast } from "./components/Toast.jsx";

// HOME FRONT — a WW2 industrial idle game.
// State and simulation live in useGameEngine. This component picks between the
// nation-selection screen and the active campaign, and mounts the toast.
export default function App() {
  const { game, nation, sim, now, toast, actions } = useGameEngine();

  return (
    <>
      {nation
        ? <GameView nation={nation} game={game} sim={sim} now={now} actions={actions} />
        : <NationPicker nations={NATIONS} onSelect={actions.selectNation} />}
      <Toast message={toast} />
    </>
  );
}
