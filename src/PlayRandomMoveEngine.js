import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function Board() {
  const [game, setGame] = useState(new Chess());

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
    return result;
}

  function makeRandomMove() {
    setGame(prevGame => {
      const possibleMoves = prevGame.moves({ verbose: true });
      if (prevGame.isGameOver() || prevGame.isDraw() || possibleMoves.length === 0) return prevGame; // exit if the game is over
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      const newPosition = new Chess(prevGame.fen())
      newPosition.move(possibleMoves[randomIndex])
      return new Chess(newPosition.fen());
    });
  }

  function onDrop(sourceSquare, targetSquare) {
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for example simplicity
    };

    const result = makeMove(move);
    if (result === null) return false;  // illegal move

    // If move was successful, schedule the random move.
    if (result) setTimeout(makeRandomMove, 100);
    return true;
  }

  return(
  <div>
    <Chessboard position={game.fen()} onPieceDrop={onDrop} />
    <button onClick={() => console.log(game)} />
  </div>
  )
}












// export default function PlayRandomMoveEngine() {
//   const [game, setGame] = useState(new Chess());

//   const makeMove = () => {
//     const moves = game.moves()
//     const move = moves[Math.floor(Math.random() * moves.length)]
//     game.move(move)
//     setGame(new Chess(game.fen()))
//   }

//   return(
//   <div>
//     <Chessboard position={game.fen()} />
//     <button onClick={makeMove}>Move</button>
//   </div>
//   )
// }