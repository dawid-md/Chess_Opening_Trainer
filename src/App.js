import PlayRandomMoveEngine from "./Pages/PlayRandomMoveEngine";
import Multiplayer from "./Pages/Multiplayer";
import { useState } from "react";
import Panel from "./Components/Panel";
import './App.css'
import Home from "./Pages/Home";
import Analysis from "./Pages/Analysis";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <div className="App">
      <Router>
        <Panel />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/multiplayer" element={<Multiplayer />} />
          <Route path="/random" element={<PlayRandomMoveEngine />} />
        </Routes>
      </Router>
    </div>
  )
}


  // const [variant, setVariant] = useState("Analysis")
  // const changeVariant = (newVariant) => {
  //   setVariant(newVariant)
  // }

  // return (
  //   <>
  //   <Panel changeVariant={changeVariant}/>
  //   {/* <h3 className="currentVariant text-center">{variant}</h3> */}
  //   <div className="home">
  //     <div className="boardDiv">
  //       {variant === "Random" ? <PlayRandomMoveEngine /> : null}
  //       {variant === "Multiplayer" ? <Multiplayer /> : null}
  //       {variant === "Analysis" ? <Analysis /> : null}
  //       {variant === "stockfish" ? <PlayRandomMoveEngine /> : null}
  //     </div>
  //   </div>
  //   </>
  // );