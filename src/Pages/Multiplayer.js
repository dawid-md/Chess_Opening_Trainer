import { useState, forwardRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import CustomSquareRenderer from "../CustomSquareRenderer";
import useSound from "use-sound"
import moveSound from "../sounds/Move.mp3"
import captureSound from "../sounds/Capture.mp3"

export default function Multiplayer() {
  const [game, setGame] = useState(new Chess());
  const [playMoveSound] = useSound(moveSound)
  const [playCaptureSound] = useSound(captureSound)
  const [mycustomSquares] = useState(["d4", "a1"])

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

    //if (result) setTimeout(makeRandomMove, 100); // If move was successful, schedule the random move.
    return true;
  }

  return(
    <div className="mainDiv">
      <div className="w-50">
        <Chessboard 
          position={game.fen()} 
          customSquare={(props) => <CustomSquareRenderer {...props} customSquares={mycustomSquares} />}
          onPieceDrop={onDrop} 
        />
      </div>
    </div>
  )
}
