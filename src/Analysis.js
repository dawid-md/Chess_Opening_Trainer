import { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import axios from "axios";

export default function Analysis() {
  const [game] = useState(new Chess()); //main representation of the board
  const [fen, setFen] = useState(game.fen()); //fen of current position, setFen triggers board refresh
  const [line, setLine] = useState([]);   //moves made on the chessboard, used for saving to database
  const [undoneMoves, setUndoneMoves] = useState([]);   //moves taken back - saved to have possibility to click next and recall them 
  const [loadedMoves, setloadedMoves] = useState([]);     //moves downloaded from database
  const [hashTableMoves, sethashTableMoves] = useState([])  //stores all positions and moves possible to each one of them (saved by user to database) - required for transposition
  const [optionSquares, setOptionSquares] = useState({}); //available moves for current piece clicked
  const [moveFrom, setMoveFrom] = useState("");


  const makeMove = (move) => {
    const possibleMoves = game.moves({ verbose: true });
    const isMovePossible = possibleMoves.some(possibleMove => 
        possibleMove.from === move.from && possibleMove.to === move.to
    );
    if (!isMovePossible) return null;
    const result = game.move(move);   //it makes changes to main game object
    if (result === null) return null;

    setLine([...line, {   //triggered before setFen in order to have position saved before move is made (transposition required)
      "move" : result.san,
      "moveVer" : move,
      "position" : fen}]);

    setFen(game.fen());   //Triggers render with new position
    setUndoneMoves([]);   //Reset undone moves when a new move is made
    setOptionSquares([])
    return result;
}

  const moveBack = () => {
    const move = game.undo();
    if(move) {
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
      setLine([...line, {   //triggered before setFen in order to have position saved before move is made (transposition required)
        "move" : move.san,
        "moveVer" : move,
        "position" : fen}]);
      setUndoneMoves(remainingUndoneMoves);
    }
  };

  function onDrop(sourceSquare, targetSquare) {
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", //always promote to a queen for simplicity
    };
    const result = makeMove(move);
    if (result === null) return false;  //illegal move
    return true;
  }

  function checkGame(){
    const fenPositionOnly = fen.split(' ').slice(0, 4).join(' ');
    if(hashTableMoves.hasOwnProperty(fenPositionOnly)){
        let newLoadedMoves = hashTableMoves[fenPositionOnly];
        newLoadedMoves = Object.values(newLoadedMoves.reduce((acc, curr) => {
            acc[curr[0]] = curr;
            return acc;
        }, {}));
        setloadedMoves(newLoadedMoves); // used for printing <p>
    } else {
        setloadedMoves([]); // prevents printing moves when position is not found
    }
  }

  function resetPosition(){
    game.reset()
    setFen(game.fen());  //Triggers render with new position
    setLine([]);
    setUndoneMoves([]); 
  }

  async function saveLine(){
    const res = await axios.post(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`, line)
    //const res = await axios.put(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White/London2.json`, line)
    console.log(res.config.data);
  }

  async function loadLine(){
    const res = await axios.get(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`);

    const allMoves = [];   // all moves and positions loaded from database
    const hashMoves = {};  // all moves and positions without fifty-move rule = need for filtering based on the current position

    for(const key in res.data){
        allMoves.push(...res.data[key]);
        for(let fenPos of res.data[key]){
            const keyPos = fenPos.position.split(' ').slice(0, 4).join(' ');
            if(!hashMoves[keyPos]){ 
                hashMoves[keyPos] = [[fenPos.move, fenPos.moveVer]]; 
            } else if (!hashMoves[keyPos].some(item => item[0] === fenPos.move)) { 
                hashMoves[keyPos].push([fenPos.move, fenPos.moveVer]); // don't add duplicates 
            }
        }
    }
    setLine(allMoves);
    sethashTableMoves(hashMoves);
}

  useEffect(() => {
    checkGame()
  }, [fen, hashTableMoves])

  function getMoveOptions(square) {
    const moves = game.moves({
      square,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares([])
      return false;
    }
    const newSquares = {};
    moves.map((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to) && game.get(move.to).color !== game.get(square).color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
      return move;
    });
    newSquares[square] = {
      background: "rgba(255, 255, 100, 0.4)",
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square) {
    if(optionSquares && Object.keys(optionSquares).length !== 0) {
      console.log('trying');
      onDrop(moveFrom, square)
    }
    //else{
      const hasOptions = getMoveOptions(square)
      if (hasOptions) setMoveFrom(square)
    //}
  }

  function onPieceDragBegin(piece, sourceSquare){
    getMoveOptions(sourceSquare)
  }

  return (
    <div>
      <Chessboard 
        position={fen} 
        onPieceDrop={onDrop} 
        onSquareClick={onSquareClick}
        onPieceDragBegin={onPieceDragBegin}
        customSquareStyles={{
          ...optionSquares,
        }}
      />
      <div className="buttons">
        <button className="takeBack" onClick={moveBack}>Back</button>
        <button className="takeForward" onClick={moveForward}>Next</button>
        <button className="save" onClick={saveLine}>Save</button>
        <button className="load" onClick={loadLine}>Load</button>
        <button onClick={checkGame}>Check</button>
        <button onClick={resetPosition}>Reset</button>
        {/* <button onClick={playMove}>x</button> */}
      </div>
      <div>
        {loadedMoves.map(move => <p key={move} style={{color : "white"}}>{move[0]}</p>)}
      </div>
    </div>
  );
}









// const playMove = () => {   //triggered only by x button, uses lineIndex 
//   let move = line[lineIndex]?.move    //? checks if move exists
//   const possibleMoves = game.moves();
//   const isMovePossible = possibleMoves.includes(move)

//   console.log(possibleMoves);
//   console.log(move);

//   if (!isMovePossible) return null;

//   const result = game.move(move);   //it makes changes to main game object
//   if (result === null) return null;

//   setlineIndex(lineIndex + 1)
//   setFen(game.fen());  //Triggers render with new position
//   setUndoneMoves([]); // Reset undone moves when a new move is made

//   return result;
// }




// const getData = async () =>{
//   const res = await axios.get(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`)
//   console.log(res);
// }

// const postData = async () => {
//   const res = await axios.post(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`, line)
//   console.log(res.config.data);
// }