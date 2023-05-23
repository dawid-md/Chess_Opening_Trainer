import PlayRandomMoveEngine from "./PlayRandomMoveEngine";
import Multiplayer from "./Multiplayer";
import { useState } from "react";
import Panel from "./Panel";
import './App.css'
import Analysis from "./Analysis";

export default function App() {
  const [variant, setVariant] = useState("multi")

  const changeVariant = (newVariant) => {
    setVariant(newVariant)
  }

  return (
    <>
    <Panel changeVariant={changeVariant}/>
    <div className="bg-dark" style={{"color" : "white"}}>{variant}</div>
    <div className="home bg-dark" style={{"height" : "100vh"}}>
      <div className="boardDiv" style={{"width" : "600px"}}>
        {variant === "random" ? <PlayRandomMoveEngine /> : null}
        {variant === "multi" ? <Multiplayer /> : null}
        {variant === "analysis" ? <Analysis /> : null}
        {variant === "stockfish" ? <PlayRandomMoveEngine /> : null}
      </div>
    </div>
    </>
  );
}
