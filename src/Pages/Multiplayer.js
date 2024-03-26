import { useState, useEffect, forwardRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import CustomSquareRenderer from "../CustomSquareRenderer";
import useSound from "use-sound"
import moveSound from "../Sounds/Move.mp3"
import captureSound from "../Sounds/Capture.mp3"

export default function Multiplayer() {
  const [game, setGame] = useState(new Chess());
  const [playMoveSound] = useSound(moveSound)
  const [playCaptureSound] = useSound(captureSound)
  const [mycustomSquares] = useState(["d4", "a1"])
  const [engine, setEngine] = useState(null);
  const [evaluation, setEvaluation] = useState("");

  useEffect(() => {
    // Initialize Stockfish engine as a web worker
    const newEngine = new Worker('stockfish.js');
    newEngine.onmessage = function(event) {
      console.log("Stockfish says: ", event.data);
      if (event.data.startsWith("info depth")) {
        setEvaluation(event.data);
      }
    };
    setEngine(newEngine);

    return () => {
      newEngine.terminate();
    };
  }, []);

  const makeMove = (move) => {
    const possibleMoves = game.moves({ verbose: true });
    const isMovePossible = possibleMoves.some(possibleMove => 
        possibleMove.from === move.from && possibleMove.to === move.to
    );

    if (!isMovePossible) return null;

    const newPosition = new Chess(game.fen())
    const result = newPosition.move(move)

    if(result.san.includes('x')){playCaptureSound()} 
    else{playMoveSound()}

    if (result === null) return null;

    setGame(new Chess(newPosition.fen()))

    // Send new position to Stockfish for evaluation
    engine.postMessage(`position fen ${newPosition.fen()}`);
    engine.postMessage("go depth 20");

    return result;
  }

  function onDrop(sourceSquare, targetSquare) {
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    };
    const result = makeMove(move);
    if (result === null) return false;  //illegal move

    return true;
  }

  return(
    <div className="mainDiv">
      <div className="board-container">
        <Chessboard 
          position={game.fen()} 
          customSquare={(props) => <CustomSquareRenderer {...props} customSquares={mycustomSquares} />}
          onPieceDrop={onDrop} 
        />
        {/* Optionally display the evaluation */}
        <div className="evaluation text-white">
          {evaluation}
        </div>
      </div>
    </div>
  )
}
