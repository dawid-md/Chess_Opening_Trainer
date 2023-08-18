import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import axios from "axios";
import CommentBox from "./CommentBox";
import { treeNode } from "./treeNode";
import { treeToPGN } from "./treeNodePgn";
import { treeToJSON } from "./treeToJSON";
import useSound from "use-sound";
import moveSound from "./sounds/Move.mp3"
import captureSound from "./sounds/Capture.mp3"

export default function Analysis() {
  const [game] = useState(new Chess()); //main representation of the board
  const [orientation, setOrientation] = useState("white")
  const [fen, setFen] = useState(game.fen()); //fen of current position, setFen triggers board refresh
  const [loadedMoves, setloadedMoves] = useState([]);     //moves downloaded from database
  const [hashTableMoves, sethashTableMoves] = useState([])  //stores all positions and moves possible to each one of them (saved by user to database) - required for transposition
  const [optionSquares, setOptionSquares] = useState({}); //available moves for current piece clicked
  const [moveFrom, setMoveFrom] = useState("");   //sets current clicked square (if legal move is possible from that square)
  const [hashComments, sethashComments] = useState({});
  const [comment, setComment] = useState({"position" : "", "comment" : "", commentID : ""});

  const [moveTree, setmoveTree] = useState(null)
  const [currentNode, setcurrentNode] = useState(null)
  const [pgnView, setpgnView] = useState("")  //string displayed inside pgn box

  const [playMoveSound] = useSound(moveSound)
  const [playCaptureSound] = useSound(captureSound)

  const makeMove = (move) => {
    const possibleMoves = game.moves({ verbose: true });
    const isMovePossible = possibleMoves.some(possibleMove => possibleMove.from === move.from && possibleMove.to === move.to)
    if (!isMovePossible) return null;

    const result = game.move(move);     //makes changes to main game object
    if (result === null) return null;

    if(result.san.includes('x')){   //playing sounds on moves
      playCaptureSound()
    } else{
        playMoveSound()}

    let childFound = false
    for(const child of currentNode.children){
      if(child.move == result.san){
        setcurrentNode(child)
        childFound = true
        break
      }
    }
    if(!childFound){
      const newNode = new treeNode(result)  //create new node
      currentNode.addChild(newNode)         //sets new node as children of the previous one
      setcurrentNode(newNode)               //sets current as the one just created
    }

    setpgnView(treeToPGN(moveTree))
    setFen(game.fen());   //Triggers render with new position
    setOptionSquares([])  //possible move for selected piece
    return result;        
  }

  const moveBack = () => {
    const move = game.undo()
    if(move) {
      setFen(game.fen())
      if(currentNode.parent != null){
        setcurrentNode(currentNode.parent)  //prevents error when stated on root
      }
    }
  };

  const moveForward = () => {
    if(currentNode.children.length > 0){
      game.move(currentNode.children[0].move) //first child is always the main line
      setFen(game.fen());
      setcurrentNode(currentNode.children[0]) //there is no need to update main tree
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
    const newTreeNode = new treeNode('root')
    setmoveTree(newTreeNode)
    setcurrentNode(newTreeNode)
    setpgnView("")
  }

  const saveTreeJSON = async () => {        //upload tree json to database
    const result = treeToJSON(moveTree)
    const res = await axios.post(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Trees.json`, result)
  }

  async function downloadtreeJSON(){
    const res = await axios.get(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Trees.json`);
    const rootNode = Object.keys(res.data)[0]
    let tree = jsonToTree(res.data[rootNode])
    game.reset()          //resets game to the starting position
    setFen(game.fen());  //Triggers render with new position
    setmoveTree(tree)
    setcurrentNode(tree)
    setpgnView(treeToPGN(tree))
  }

  function jsonToTree(jsonObject, parent = null) {  //convert downloaded json back to tree
    const node = new treeNode(jsonObject.move ? {
        san: jsonObject.move,
        after: jsonObject.fen
    } : 'root', parent);

    jsonObject.children?.forEach(child => {
        const childNode = jsonToTree(child, node);
        node.addChild(childNode);
    });

    return node;
  }

  async function saveComment(){
    if(comment != ""){
      const res = await axios.post(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Comments.json`, comment)
      console.log("comment saved");
    } 
    else{ //update comment
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
    if(moveTree == null){
      const rootNode = new treeNode('root')
      //console.log(rootNode);
      setmoveTree(rootNode)
      setcurrentNode(rootNode)
    }

    checkGame()
  }, [fen, hashTableMoves, hashComments])

  return (
    <div className="mainDiv">

      <div className="leftPanel text-center">
        <div className="loadedMoves mx-2 px-1"> 
          {loadedMoves.map(move => <p key={move} style={{color : "white"}}>{move[0]}</p>)}
        </div>

        <div className="openings mx-2 my-2">
          {/* <CommentBox comment={comment} setComment={setComment} position={fen} /> */}
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
          {/* <button className="btn btn-light btn-sm mx-1" onClick={saveLine}>Save</button>
          <button className="btn btn-light btn-sm mx-1" onClick={updateLineBase}>Update</button>
          <button className="btn btn-light btn-sm mx-1" onClick={loadLine}>Load</button> */}
          <button className="btn btn-light btn-sm mx-1" onClick={checkGame}>Check</button>
          <button className="btn btn-light btn-sm mx-1" onClick={resetPosition}>Reset</button>
          <button className="btn btn-light btn-sm mx-1" onClick={() => {
            if(orientation === "white"){setOrientation("black")}
            else{setOrientation("white")}
          }}>Flip Board</button>
          <button className="btn btn-light btn-sm mx-1" onClick={saveTreeJSON}>Save</button>
          <button className="btn btn-light btn-sm mx-1" onClick={downloadtreeJSON}>Load</button>
        </div>
      </div>
      
      <div className="rightpanel">

        <div className="moveMades mx-2 px-1 text-white">
          <p>{pgnView}</p>
        </div>

        <div className="commentsDiv mx-2 my-2">
          <CommentBox comment={comment} setComment={setComment} position={fen} />
        </div>
        
        <div className="commentButtons text-center">
          <button className="btn btn-light btn-sm mx-2" onClick={saveComment}>Save</button>
          <button className="btn btn-light btn-sm" onClick={loadComment}>Load</button>
          <button className="btn btn-light btn-sm mx-2" onClick={deleteComment}>Delete</button>
        </div>

      </div>

    </div>
  );
}