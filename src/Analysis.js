import { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import axios from "axios";
import CommentBox from "./CommentBox";

export default function Analysis() {
  const [game] = useState(new Chess()); //main representation of the board
  const [orientation, setOrientation] = useState("white")
  const [fen, setFen] = useState(game.fen()); //fen of current position, setFen triggers board refresh
  const [line, setLine] = useState([]);   //moves made on the chessboard, used for saving to database
  const [moves, setMoves] = useState([])  //just for pair move notation
  const [undoneMoves, setUndoneMoves] = useState([]);   //moves taken back - saved to have possibility to click next and recall them 
  const [loadedMoves, setloadedMoves] = useState([]);     //moves downloaded from database
  const [hashTableMoves, sethashTableMoves] = useState([])  //stores all positions and moves possible to each one of them (saved by user to database) - required for transposition
  const [optionSquares, setOptionSquares] = useState({}); //available moves for current piece clicked
  const [moveFrom, setMoveFrom] = useState("");   //sets current clicked square (if legal move is possible from that square)
  const [hashComments, sethashComments] = useState({});
  const [comment, setComment] = useState({"position" : "", "comment" : "", commentID : ""});

  const [pgnData, setPgnData] = useState({
    event: "",
    site: "",
    date: "",
    round: "",
    white: "",
    black: "",
    result: "*",
    moves: []
  });

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

      setPgnData(prev => ({
        ...prev, 
        moves: [...prev.moves, result.san]
      }));

    const lastMovePair = moves[moves.length - 1];
    if (!lastMovePair || lastMovePair.length === 2) {
      setMoves([...moves, [result.san]]);
    } else {
      setMoves([...moves.slice(0, -1), [...lastMovePair, result.san]]);
    }

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

      const lastMovePair = moves[moves.length - 1];
      if (lastMovePair.length === 2) {
        setMoves([...moves.slice(0, -1), [lastMovePair[0]]]); //delete last pair and add one remembered move to it
      } else {
        setMoves([...moves.slice(0, -1)]);
      }

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

      const lastMovePair = moves[moves.length - 1];
      if (!lastMovePair || lastMovePair.length === 2) {
        setMoves([...moves, [move.san]]);
      } else {
        setMoves([...moves.slice(0, -1), [...lastMovePair, move.san]]);
      }

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

    let loadedComment = hashComments[fenPositionOnly]?.comment
    let loadedCommentID = hashComments[fenPositionOnly]?.commentID
    
    setComment({
      position: fen,
      comment: loadedComment || "",
      commentID: loadedCommentID || ""
    });
  }

  function resetPosition(){
    game.reset()
    setFen(game.fen());  //Triggers render with new position
    setLine([]);
    setMoves([])
    setUndoneMoves([]); 
  }

  async function saveLine(){
    const res = await axios.post(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`, line)
    //const res = await axios.put(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White/London2.json`, line)
    console.log(res.config.data);
  }

  async function updateLine(){
    const res = await axios.patch(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`, line)
    //const res = await axios.put(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White/London2.json`, line)
    console.log(res.config.data);
  }

  async function saveComment(){
    if(comment != ""){
      const res = await axios.post(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Comments.json`, comment)
      console.log("comment saved");
    } 
    else{
      const res = await axios.patch(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Comments/${comment.commentID}.json`, {"comment" : comment.comment})
      console.log("comment updated");
    }
    loadComment()
  }

  async function deleteComment(){
    if(comment.commentID != ""){
      const res = await axios.delete(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Comments/${comment.commentID}.json`)
      loadComment()
    }
  }

  async function loadLine(){
    const res = await axios.get(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/White.json`);
    //const allMoves = [];   // all moves and positions loaded from database
    const hashMoves = {};  // all moves and positions without fifty-move rule = need for filtering based on the current position

    for(const key in res.data){
        for(let fenPos of res.data[key]){
            const keyPos = fenPos.position.split(' ').slice(0, 4).join(' ');
            if(!hashMoves[keyPos]){ 
                hashMoves[keyPos] = [[fenPos.move, fenPos.moveVer, fenPos.comment]]; 
            } else if (!hashMoves[keyPos].some(item => item[0] === fenPos.move)) { 
                hashMoves[keyPos].push([fenPos.move, fenPos.moveVer]); // don't add duplicates 
            }
        }
    }
    sethashTableMoves(hashMoves);
  }

  async function loadComment(){
    const res = await axios.get(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Comments.json`);
    const hashComments = {};

    for(const key in res.data){
        const keyPos = res.data[key]["position"].split(' ').slice(0, 4).join(' ')
        if(!hashComments[keyPos]){ 
          hashComments[keyPos] = {
            "comment" : res.data[key]["comment"],
            "commentID" : key
          }
        }
    }
    sethashComments(hashComments)
  }

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
      onDrop(moveFrom, square)
    }
      const hasOptions = getMoveOptions(square)
      if (hasOptions) setMoveFrom(square)
  }

  function onPieceDragBegin(piece, sourceSquare){
    getMoveOptions(sourceSquare)
  }

  useEffect(() => {
    console.log("rendered");
    checkGame()
  }, [fen, hashTableMoves, hashComments])

  return (
    <div className="mainDiv">

      <div className="leftPanel text-center mx-2 px-1">
        <div className="loadedMoves"> 
          {loadedMoves.map(move => <p key={move} style={{color : "white"}}>{move[0]}</p>)}
        </div>
      </div>

      <div className="chessboardDiv w-75">
        <Chessboard 
          position={fen} 
          boardOrientation={orientation}
          onPieceDrop={onDrop} 
          onSquareClick={onSquareClick}
          onPieceDragBegin={onPieceDragBegin}
          customSquareStyles={{...optionSquares}}
        />

        <div className="buttons">
          <button className="btn btn-light btn-sm mx-1" onClick={moveBack}>Undo</button>
          <button className="btn btn-light btn-sm mx-1" onClick={moveForward}>Next</button>
          <button className="btn btn-light btn-sm mx-1" onClick={saveLine}>Save</button>
          <button className="btn btn-light btn-sm mx-1" onClick={updateLine}>Update</button>
          <button className="btn btn-light btn-sm mx-1" onClick={loadLine}>Load</button>
          {/* <button className="btn btn-light btn-sm mx-1" onClick={checkGame}>Check</button> */}
          <button className="btn btn-light btn-sm mx-1" onClick={resetPosition}>Reset</button>
          <button className="btn btn-light btn-sm mx-1" onClick={() => {
            if(orientation === "white"){setOrientation("black")}
            else{setOrientation("white")}
          }}>Flip Board</button>
        </div>
      </div>
      
      <div className="rightpanel">

        <div className="moveMades mx-2 px-1">
          <ul className="text-white list-unstyled">
            {moves.map((movePair, index) => (
              <li key={index}>
                {index + 1}. {movePair.join(', ')}
              </li>
            ))}
          </ul>
        </div>

        <div className="commentsDiv mx-2 my-2">
          <CommentBox comment={comment} setComment={setComment} position={fen} />
        </div>
        
        <div className="commentButtons text-center">
          <button className="btn btn-light btn-sm mx-2" onClick={saveComment}>Save</button>
          <button className="btn btn-light btn-sm" onClick={loadComment}>Load</button>
          <button className="btn btn-light btn-sm mx-2" onClick={deleteComment}>Delete</button>
          {/* <button className="btn btn-light btn-sm mx-2" onClick={updateComment}>Update</button> */}
        </div>

      </div>

    </div>
  );
}