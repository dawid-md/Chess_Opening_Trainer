import './App.css'
import PlayRandomMoveEngine from "./Pages/PlayRandomMoveEngine";
import Multiplayer from "./Pages/Multiplayer";
import Panel from "./Components/Panel";
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