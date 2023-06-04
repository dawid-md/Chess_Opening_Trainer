import PlayRandomMoveEngine from "./PlayRandomMoveEngine";
import Multiplayer from "./Multiplayer";
import { useState } from "react";
import Panel from "./Panel";
import './App.css'
import Analysis from "./Analysis";

export default function App() {
  const [variant, setVariant] = useState("Analysis")

  const changeVariant = (newVariant) => {
    setVariant(newVariant)
  }

  return (
    <>
    <Panel changeVariant={changeVariant}/>
    <h3 className="currentVariant text-center">{variant}</h3>
    <div className="home">
      <div className="boardDiv">
        {variant === "random" ? <PlayRandomMoveEngine /> : null}
        {variant === "Multiplayer" ? <Multiplayer /> : null}
        {variant === "Analysis" ? <Analysis /> : null}
        {variant === "stockfish" ? <PlayRandomMoveEngine /> : null}
      </div>
    </div>
    </>
  );
}
