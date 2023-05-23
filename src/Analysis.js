import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import axios from "axios";

export default function Analysis() {
  const [game, setGame] = useState(new Chess());
  const [line, setLine] = useState([])

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

    const newPosition = new Chess(game.fen())
    const result = newPosition.move(move)

    if (result === null) return null;

    setGame(new Chess(newPosition.fen()))
    //getData()
    console.log(result.san)
    const newLine = line
    newLine.push(result.san)
    setLine(newLine)
    postData(newLine)
    return result;
}

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

  return(
  <div>
    <Chessboard position={game.fen()} onPieceDrop={onDrop} />
  </div>
  )
}
