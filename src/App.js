import PlayRandomMoveEngine from "./PlayRandomMoveEngine";
import Multiplayer from "./Multiplayer";
import { useState } from "react";
import Panel from "./Panel";
import './App.css'

export default function App() {

  const [variant, setVariant] = useState("multi")

  return (
    <>
    <Panel />
    <div className="home bg-dark" style={{"height" : "100vh"}}>
      <div className="boardDiv" style={{"width" : "600px"}}>
        {variant === "random" ? <PlayRandomMoveEngine /> : null}
        {variant === "multi" ? <Multiplayer /> : null}
        {variant === "analysis" ? <PlayRandomMoveEngine /> : null}
        {variant === "stockfish" ? <PlayRandomMoveEngine /> : null}
      </div>
    </div>
    </>
  );
}
