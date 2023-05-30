import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import axios from "axios";

export default function Analysis() {
  const [game] = useState(new Chess()); //main representation of the board
  const [fen, setFen] = useState(game.fen()); //fen of current position, setFen triggers board refresh
  const [line, setLine] = useState([]);
  const [lineIndex, setlineIndex] = useState(0)
  const [undoneMoves, setUndoneMoves] = useState([]);
  const [loadedMoves, setloadedMoves] = useState([]);
  const [hashTableMoves, sethashTableMoves] = useState([])

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
      "position" : fen}]);

    setFen(game.fen());   //Triggers render with new position
    setUndoneMoves([]);   //Reset undone moves when a new move is made

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
      setLine([...line, move.san]);
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
    const availableMoves = []
    const fenPositionOnly = fen.split(' ').slice(0, 4).join(' ')
    //console.log(hashTableMoves);
    const filteredMoves = Object.keys(hashTableMoves).filter(key => {
      if (key === fenPositionOnly){
        console.log(hashTableMoves[fenPositionOnly])
      }
    })

    filteredMoves.forEach(move => availableMoves.push(...move))
    setloadedMoves(availableMoves)
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
    const res = await axios.get(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`)
    //resetPosition()
    const allMoves = []   //all moves and positions loaded from database
    const hashMoves = []  //all moves and positions without fifty-move rule = need for filtering based on the current position

    for(const [key] of Object.entries(res.data)){
      allMoves.push(...res.data[key])
      for(let fenPos of res.data[key]){
        const keyPos = fenPos.position.split(' ').slice(0, 4).join(' ')
        if(hashMoves[keyPos] === undefined){ hashMoves[keyPos] = [fenPos.move] }
        else if (hashMoves[keyPos].indexOf(fenPos.move) == -1) { hashMoves[keyPos].push(fenPos.move) }  //don't add duplicates
      }
    }
    setLine(allMoves)
    sethashTableMoves(hashMoves)
    console.log(hashMoves);
  }

  const playMove = () => {
    let move = line[lineIndex]?.move  //? checks if move exists
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
      <div>
        {loadedMoves.map(move => <p style={{color : "white"}}>{move}</p>)}
      </div>
    </div>
  );
}









// const getData = async () =>{
//   const res = await axios.get(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`)
//   console.log(res);
// }

// const postData = async () => {
//   const res = await axios.post(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`, line)
//   console.log(res.config.data);
// }