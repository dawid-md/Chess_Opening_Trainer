import { useContext, useEffect, useState } from "react"
import { Chess } from "chess.js"
import { Chessboard } from "react-chessboard"
import CommentBox from "../Components/CommentBox"
import { treeNode } from "../treeNode"
import { treeToPGN } from "../treeNodePgn"
import useSound from "use-sound"
import moveSound from "../Sounds/Move.mp3"
import captureSound from "../Sounds/Capture.mp3"
import errorSound from "../Sounds/Error.mp3"
import { getDatabase, ref, get, push, remove, update, query, orderByChild, equalTo, child } from 'firebase/database'
import { app } from "../Config/firebase"  //this is important, don't comment it out
import { AuthContext } from "../App"

export default function Training() {
  const {user} = useContext(AuthContext)
  const [game] = useState(new Chess())  //main representation of the board
  const [orientation, setOrientation] = useState("white")
  const [fen, setFen] = useState(game.fen())  //fen of current position, setFen triggers board refresh
  const [optionSquares, setOptionSquares] = useState({})  //available moves for current piece clicked
  const [moveFrom, setMoveFrom] = useState(null)   //sets current clicked square (if legal move is possible from that square)
  const [hashComments, sethashComments] = useState({})
  const [comment, setComment] = useState({"position" : "", "comment" : "", commentID : ""})
  const [openings, setOpenings] = useState([])    //opening downloaded from database
  const [openingID, setOpeningID] = useState([""])  //id of the current opening that is selected by user and edited
  const [openingName, setopeningName] = useState("")  //name chosed before saving 
  const [openingColor, setopeningColor] = useState("")  //name chosed before saving 
  const [bookMoves, setbookMoves] = useState([])    //saved moves that application suggests with arrows
  const [bookMovesArrows, setbookMovesArrows] = useState([])    //suggests saved moves

  const [moveTree, setmoveTree] = useState(null)  //main tree of all nodes (moves)
  const [currentNode, setcurrentNode] = useState(null)
  const [pgnView, setpgnView] = useState("")    //string displayed inside pgn box

  const [trainingUserColor, setTrainingUserColor] = useState('white')
  const [trainingType, setTrainingType] = useState('standard')

  const [playMoveSound] = useSound(moveSound)
  const [playCaptureSound] = useSound(captureSound)
  const [playErrorSound] = useSound(errorSound)

  const makeMove = (move) => {
    const result = game.move(move)     //makes changes to main game object
    let childBookMoveFound = currentNode.children.find((child) => child.move === result.san)  //check if user move is the book move
    if(childBookMoveFound){
      MoveSound(result)
      setFen(game.fen())    //Triggers render with new position
      setcurrentNode(childBookMoveFound)  //set found node as the main node
      if(childBookMoveFound.children.length > 0){  //if new main node has children then pick the random one
        setTimeout(() => {
          const randomChild = Math.floor(Math.random() * childBookMoveFound.children.length-1) + 1
          const result = game.move(childBookMoveFound.children[randomChild].move)   //first child is always the main line
          setFen(game.fen())  //Triggers render with new position
          setcurrentNode(childBookMoveFound.children[randomChild])   //!!!!!!need to check that, why the 0 child is set if we use random child in previous step?
          MoveSound(result)
        }, 300)
      }
    }else{   //if played move is not the book move
      playErrorSound()
      game.undo()
      //return false
    }       
  }

  const MoveSound = (result) => {
    if(result.san.includes('x')){     //playing sounds on moves
      playCaptureSound()
    } else {
      playMoveSound()
    }
  }

  const moveBack = () => {
    const move = game.undo()
    if(move) {
      setFen(game.fen())    
      if(currentNode.parent != null){   //prevents error when stated on root
        setcurrentNode(currentNode.parent)    
      }
    }
  }

  const moveForward = () => {
    if(currentNode.children.length > 0){
      game.move(currentNode.children[0].move)   //first child is always the main line - need to improve that
      setFen(game.fen())
      setcurrentNode(currentNode.children[0])   //there is no need to update main tree
    }
  }

  function onDrop(sourceSquare, targetSquare) { 
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    }
    const possibleMoves = game.moves({ verbose: true })   //verbose true means to add ALSO "from - to" syntax of moves
    const isMovePossible = possibleMoves.some(possibleMove => possibleMove.from === move.from && possibleMove.to === move.to)
    setMoveFrom(null)                //move is made so it should be reset anyway
    setOptionSquares([])            //after move is made we can hide possible moves for selected piece
    const result = isMovePossible ? makeMove(move) : null  //maybe move made is need in order to get san result
    return result !== null;       //if result === null return false, else return true
  }

  const chooseTrainingMove = () => {
    if(currentNode.children.length > 0){
      setTimeout(() => {
        const randomChild = Math.floor(Math.random() * currentNode.children.length-1) + 1
        const result2 = game.move(currentNode.children[randomChild].move)   //first child is always the main line
        setFen(game.fen())
        setcurrentNode(currentNode.children[randomChild])   //!!!!!!need to check that, why the 0 child is set if we use random child in previous step?
        MoveSound(result2)
      }, 300)
    }
  }

  function resetPosition(){
    game.reset()
    setFen(game.fen())    //Triggers render with new position
    const newTreeNode = new treeNode('root')  //creates new blank root with starting position
    setmoveTree(newTreeNode)
    setcurrentNode(newTreeNode)
    setOpeningID("")
    setpgnView("")
    sethashComments({})
  }

  async function getOpenings(){
    const db = getDatabase()
    const openingsRef = query(ref(db, 'Openings'), orderByChild('userID'), equalTo(user.uid))
    try{
      const snapshot = await get(openingsRef)
      if(snapshot.exists()) {
        const data = snapshot.val()
        const openingsArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
        setOpenings(openingsArray)
      } else {
        console.log("No data available")
      }
    } catch (error) {
      console.log(error);
    }
  }

  function selectOpening(id){
    const rootNode = openings.find(opening => opening.id === id)
    let tree = jsonToTree(rootNode)  //convert flat json to tree
    game.reset()          //resets game to the starting position
    setFen(game.fen())    //Triggers render with new position
    setOpeningID(id)      //id of selected opening by user
    setmoveTree(tree)
    setcurrentNode(tree)
    setpgnView(treeToPGN(tree))

    if(trainingUserColor === "black"){  //make the first move for white cpu
      setOrientation("black")
      setTimeout(() => {
        const randomChild = Math.floor(Math.random() * tree.children.length-1) + 1
        const result = game.move(tree.children[randomChild].move)   //first child is always the main line
        setFen(game.fen())  //Triggers render with new position
        setcurrentNode(tree.children[randomChild])
        MoveSound(result)
      }, 500)
    } else{
      setOrientation("white")
    }
  }

  function jsonToTree(flatJson) {
    const { rootId, nodes } = flatJson    //Extract the root ID and the flat nodes object
    function processNode(nodeId, parent = null) {
      const jsonNode = nodes[nodeId]    //Get the node from the flat nodes object using the ID
      const newNode = new treeNode(jsonNode.move ? {      //Create a tree node from the JSON node, including the parent if provided
          san: jsonNode.move,
          after: jsonNode.fen
      } : 'root', parent)  //Changed variable name to 'newNode'
      jsonNode.children?.forEach(childId => {   //Recursively process the children, adding them to the tree node
        const childNode = processNode(childId, newNode);
        newNode.addChild(childNode);      //Changed variable name to 'newNode'
      });
      return newNode;     //Changed variable name to 'newNode'
    }
    return processNode(rootId)    //Start the recursive processing with the root ID
  }

  function getMoveOptions(square) {
    const moves = game.moves({
      square,
      verbose: true,
    })
    if (moves.length === 0) {
      setOptionSquares([])
      return false
    }
    const newSquares = {}
    moves.forEach((move) => {     //changed from map
      newSquares[move.to] = {
        background: "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      }
    })
    setOptionSquares(newSquares)
    return true
  }

  function onSquareClick(square) {
    if(optionSquares && Object.keys(optionSquares).length !== 0 && optionSquares[square]) {    //if this is the "drop piece" click to confirm the move
      onDrop(moveFrom, square)
    }
    else{
      setMoveFrom(square)
      getMoveOptions(square)
    }
  }

  function onPieceDragBegin(piece, sourceSquare){
    const hasOptions = getMoveOptions(sourceSquare)
    if (hasOptions) {setMoveFrom(sourceSquare)}
  }

  const switchColor = () => {
    if(trainingUserColor === "white"){
      setTrainingUserColor("black")
    } else{
      setTrainingUserColor("white")
    }
  }

  useEffect(() => {
    if(moveTree == null){
      const rootNode = new treeNode('root')
      setmoveTree(rootNode)
      setcurrentNode(rootNode)
    }
    const newbookMoves = []
    if(currentNode && newbookMoves.length === 0){
      for(const child of currentNode.children){ //all nodes have empty child as default set in 'new treeNode('root')'
        newbookMoves.push(child.move)
      }
      setbookMoves(newbookMoves)
    }

    if(user && openings.length === 0 && moveTree && Object.keys(hashComments).length === 0 ){   //checks user and movetree to avoid unnecessary comments download
      getOpenings()
      console.log('loaded openings');
    }

  }, [fen, currentNode, openingID])  //should check how it affects animations

  return (
    <div className="mainDiv">

      <div className="leftPanel">

        <div className="loadedMoves"> 
          {bookMoves.map(elem => <p key={elem} style={{color : "white"}}>{elem}</p>)}
        </div>

        <div className="openings text-white">
          <h5>Select Opening</h5>
          {openings.map((item, index) => (
          <div key={index} className="userOpening">
            <p style={{height: '10px', width: '10px', 
                      borderRadius: '50%', marginRight: '7px',
                      backgroundColor: item.color, border: '1px solid gray'}}></p> 
            <p id={item.id} key={index} onClick={() => selectOpening(item.id)}>{item.name}</p>
          </div>))}
        </div>
      </div>

      <div className="board-container">
        <Chessboard 
          position={fen} 
          boardOrientation={orientation}
          onPieceDrop={onDrop} 
          onSquareClick={onSquareClick}
          onPieceDragBegin={onPieceDragBegin}
          customSquareStyles={optionSquares}    //available moves for clicked piece
          customArrows={bookMovesArrows}
        />

        <div className="buttons">
          <button className="btn-light" onClick={moveBack}>Undo</button>
          <button className="btn-light" onClick={moveForward}>Next</button>
          <button className="btn-light" onClick={resetPosition}>Reset</button>
          <button className="btn-light" onClick={() => {setOrientation(prevOrientation => (prevOrientation === "white" ? "black" : "white"))}}>Flip Board</button>
          <button className="btn-light" onClick={getOpenings}>Openings</button>
          <button className={`btn-light ${openingID ? 'disabled' : ''}`} onClick={switchColor}>{trainingUserColor}</button>
        </div>
      </div>
      
      <div className="rightpanel">

        <div className="moveMades text-white">  {/* pgn view of line */}
          <p>{pgnView}</p>
        </div>

        <div className="commentsDiv">
          <CommentBox comment={comment} setComment={setComment} position={fen} />
        </div>
        
        <div className="commentButtons text-center">
        </div>

      </div>
    </div>
  )
}