import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import axios from "axios";

export default function Analysis() {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [line, setLine] = useState([]);
  const [lineIndex, setlineIndex] = useState(0)
  const [undoneMoves, setUndoneMoves] = useState([]);

  const getData = async () =>{
    const res = await axios.get(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`)
    console.log(res);
  }

  const postData = async () => {
    const res = await axios.post(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`, line)
    console.log(res.config.data);
  }

  const makeMove = (move) => {
    const possibleMoves = game.moves({ verbose: true });
    const isMovePossible = possibleMoves.some(possibleMove => 
        possibleMove.from === move.from && possibleMove.to === move.to
    );
    if (!isMovePossible) return null;
    const result = game.move(move);   //it makes changes to main game object
    if (result === null) return null;

    setFen(game.fen());  //Triggers render with new position
    setLine([...line, result.san]);
    setUndoneMoves([]); // Reset undone moves when a new move is made

    return result;
}

  const moveBack = () => {
    const move = game.undo();
    if (move) {
      setFen(game.fen());
      setLine(line.slice(0, line.length - 1));
      setUndoneMoves([move, ...undoneMoves]);
    }
  };

  const moveForward = () => {
    if (undoneMoves.length > 0) {
      const [move, ...remainingUndoneMoves] = undoneMoves;
      game.move(move);
      setFen(game.fen());
      setLine([...line, move.san]);
      setUndoneMoves(remainingUndoneMoves);
    }
  };

  function onDrop(sourceSquare, targetSquare) {
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for simplicity
    };
    const result = makeMove(move);
    if (result === null) return false;  // illegal move
    return true;
  }

  function checkGame(){
    console.log(game.history());
  }

  function resetPosition(){
    game.reset()
    setFen(game.fen());  //Triggers render with new position
    setLine([]);
    setUndoneMoves([]); 
  }

  async function saveLine(){
    //const res = await axios.post(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`, line)
    const res = await axios.put(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White/London.json`, line)
    console.log(res.config.data);
  }

  async function loadLine(){
    const res = await axios.get(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`)
    resetPosition()
    console.log(res.data.London);
    setLine(res.data.London)
  }

  const playMove = () => {
    let move = line[lineIndex]
    const possibleMoves = game.moves();
    const isMovePossible = possibleMoves.includes(move)

    console.log(possibleMoves);
    console.log(move);

    if (!isMovePossible) return null;

    const result = game.move(move);   //it makes changes to main game object
    if (result === null) return null;

    setlineIndex(lineIndex + 1)
    setFen(game.fen());  //Triggers render with new position
    setUndoneMoves([]); // Reset undone moves when a new move is made

    return result;
}

  return (
    <div>
      <Chessboard position={fen} onPieceDrop={onDrop} />
      <div className="buttons">
        <button className="takeBack" onClick={moveBack}>Back</button>
        <button className="takeForward" onClick={moveForward}>Next</button>
        <button className="save" onClick={saveLine}>Save</button>
        <button className="load" onClick={loadLine}>Load</button>
        <button onClick={checkGame}>Check</button>
        <button onClick={resetPosition}>Reset</button>
        <button onClick={playMove}>x</button>
      </div>
    </div>
  );
}
