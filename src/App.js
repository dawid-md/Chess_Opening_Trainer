import './App.css'
import PlayRandomMoveEngine from "./Pages/PlayRandomMoveEngine";
import Multiplayer from "./Pages/Multiplayer";
import Panel from "./Components/Panel";
import Home from "./Pages/Home";
import Analysis from "./Pages/Analysis";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Register from './Pages/Register';
import Login from './Pages/Login';
import { useState, useEffect, createContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export const AuthContext = createContext()

export default function App() {
  const [user, setUser] = useState(null)
  const auth = getAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) =>{
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()  //cleanup on unmount
  })

  if (loading) {
    return <div>Loading...</div>;  //if checking user is still processing
  }

  return (
    <div className="App">
      <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <Panel />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/multiplayer" element={<Multiplayer />} />
          <Route path="/random" element={<PlayRandomMoveEngine />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
      </AuthContext.Provider>
    </div>
  )
}