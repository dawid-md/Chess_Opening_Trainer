import { useContext, useEffect, useMemo, useState } from "react"
import { Chess } from "chess.js"
import { Chessboard } from "react-chessboard"
import CommentBox from "../Components/CommentBox"
import { treeNode } from "../treeNode"
import { treeToPGN } from "../treeNodePgn"
import { treeToJSON } from "../treeToJSON"
import useSound from "use-sound"
import moveSound from "../Sounds/Move.mp3"
import captureSound from "../Sounds/Capture.mp3"
import { getDatabase, ref, get, push, remove, update, query, orderByChild, equalTo } from 'firebase/database'
import { app } from "../Config/firebase"  //this is important, don't comment it out
import { AuthContext } from "../App"
import { ArrowClockwise, ArrowDownUp, ArrowLeft, ArrowRepeat, ArrowRight } from "react-bootstrap-icons"
import SimpleModal from "../Components/SimpleModal"

export default function Analysis() {
  const {user} = useContext(AuthContext)
  const game = useMemo(() => new Chess(), [])  //main representation of the board
  const [orientation, setOrientation] = useState("white")
  const [fen, setFen] = useState(game.fen())  //fen of current position, setFen triggers board refresh
  const [optionSquares, setOptionSquares] = useState({})  //available moves for current piece clicked
  const [moveFrom, setMoveFrom] = useState("")   //sets current clicked square (if legal move is possible from that square)
  const [hashComments, setHashComments] = useState({})
  const [comment, setComment] = useState({"position" : "", "comment" : "", commentID : ""})
  const [openings, setOpenings] = useState([])    //opening downloaded from database
  const [openingID, setOpeningID] = useState("")  //id of the current opening that is selected by user and edited
  const [bookMoves, setbookMoves] = useState([])      //saved book moves that application suggests with arrows
  const [bookMovesArrows, setbookMovesArrows] = useState([])    //suggests saved book moves
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [moveTree, setmoveTree] = useState(null)  //main tree of all nodes (moves)
  const [currentNode, setcurrentNode] = useState(null)
  const [pgnView, setpgnView] = useState("")    //string displayed inside pgn box

  const [playMoveSound] = useSound(moveSound)
  const [playCaptureSound] = useSound(captureSound)

  const makeMove = (move) => {
    const possibleMoves = game.moves({ verbose: true })
    const isMovePossible = possibleMoves.some(possibleMove => possibleMove.from === move.from && possibleMove.to === move.to)
    if (!isMovePossible) return null

    const result = game.move(move)     //makes changes to main game object
    if (result === null) return null

    if(result.san.includes('x')){     //playing sounds on moves
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
      const newNode = new treeNode(result)    //create new node
      currentNode.addChild(newNode)           //sets new node as children of the previous one ??? changing state ???
      setcurrentNode(newNode)                 //sets current as the one just created
    }

    setpgnView(treeToPGN(moveTree))
    setFen(game.fen())    //Triggers render with new position
    setOptionSquares([])  //after move is made we can clear possible moves for selected piece

    return result   //actually optional
  }

  const moveBack = () => {
    const move = game.undo()
    if(move) {
      setFen(game.fen())
      if(currentNode.parent != null){
        setcurrentNode(currentNode.parent)    //prevents error when stated on root
      }
    }
  }

  const moveForward = () => {
    if(currentNode.children.length > 0){
      game.move(currentNode.children[0].move)   //first child is always the main line
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
    const result = makeMove(move)
    return result !== null; //if result === null return false, else return true
  }

  function checkGame(){
    const fenPositionOnly = fen.split(' ').slice(0, 4).join(' ')  //remove last part of fen to enable transposition

    let loadedComment = hashComments[fenPositionOnly]?.comment
    let loadedCommentID = hashComments[fenPositionOnly]?.commentID
    
    setComment({
      position: fen,
      comment: loadedComment || "",
      commentID: loadedCommentID || ""
    })
  }

  function resetPosition(){
    game.reset()
    setFen(game.fen())    //Triggers render with new position
    const newTreeNode = new treeNode('root')
    setmoveTree(newTreeNode)
    setcurrentNode(newTreeNode)
    setOpeningID("")
    setpgnView("")
    setHashComments({})
  }

  const saveOpening = async (openingName, openingColor) => {      //upload opening tree json to database
    const db = getDatabase()
    const openingsRef = ref(db, 'Openings')
    const result = treeToJSON(moveTree)   //convert tree to more flat structure
    result.name = openingName
    result.color = openingColor

    if(openingID == ""){
      result.userID = user.uid
      try {
        await push(openingsRef, result)  //upload whole result object to database
        setIsModalOpen(false)
      } catch (error) {
        console.log(error)
      }
      // setopeningName("")
    } else {
      const specificOpeningRef = ref(db, `Openings/${openingID}`)
      try{
        await update(specificOpeningRef, { "nodes": result.nodes })
        console.log('opening updated');
      } catch (error) {
        console.log(error);
      }
    }
  }

  async function getOpenings(){
    const db = getDatabase()
    const openingsRef = query(ref(db, 'Openings'), orderByChild('userID'), equalTo(user.uid))
    try{
      const snapshot = await get(openingsRef)
      if(snapshot.exists()) {
        const data = snapshot.val()
        //console.log(data);
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
    let tree = jsonToTree(rootNode)  //convert json to tree
    game.reset()          //resets game to the starting position
    setFen(game.fen())    //Triggers render with new position
    setOpeningID(id)      //id of selected opening by user
    setmoveTree(tree)
    setcurrentNode(tree)
    setpgnView(treeToPGN(tree))
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

  async function loadComment(){
    const db = getDatabase()
    const commentsRef = ref(db, 'Comments')
    const hashComments = {}
  
    try {
      const snapshot = await get(commentsRef)
      if (snapshot.exists()) {
        const data = snapshot.val()
        for(const key in data){
          const keyPos = data[key]["position"].split(' ').slice(0, 4).join(' ') //don't include last part of fen
          if(!hashComments[keyPos]){
            hashComments[keyPos] = {
              "comment" : data[key]["comment"],
              "commentID" : key
            }
          }
        }
      } else {
        console.log("No comments available")
      }
      setHashComments(hashComments)
    } catch (error) {
      console.log(error)
    }
  }

  async function saveComment(){
    const db = getDatabase();
    const commentsRef = ref(db, 'Comments');
    console.log(comment)
    if(comment.commentID == ""){
      try {
        await push(commentsRef, comment);
        console.log("comment saved");
      } catch (error) {
        console.log(error);
      }
    } else {    //update comment
      const specificCommentRef = ref(db, `Comments/${comment.commentID}`);
      try {
        await update(specificCommentRef, { "comment": comment.comment });
        //console.log("comment updated");
      } catch (error) {
        console.log(error);
      }
    }
    loadComment();
  }

  async function deleteComment(){
    const db = getDatabase()
  
    if(comment.commentID != ""){
      const commentRef = ref(db, `Comments/${comment.commentID}`)
      try {
        await remove(commentRef)
        loadComment()
      } catch (error) {
        console.log(error)
      }
    }
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
    if(optionSquares && Object.keys(optionSquares).length !== 0) {    //if this is the "drop piece" click to confirm the move
      onDrop(moveFrom, square)
    }
    else{
      const hasOptions = getMoveOptions(square)
      if (hasOptions) {
        setMoveFrom(square)
      }
    }
  }

  // function onPieceDragBegin(piece, sourceSquare){
  //   const hasOptions = getMoveOptions(sourceSquare)
  //   if (hasOptions) {setMoveFrom(sourceSquare)}
  // }

  const handleKeyPress = (event) => {
    if(event.key === "ArrowRight"){moveForward()}
    if(event.key === "ArrowLeft"){moveBack()}
  }

  function deleteMove(){
    const parentNode = currentNode.parent
    const index = currentNode.parent.children.findIndex(child => child.move === currentNode.move)
    currentNode.parent.children.splice(index, 1)
    game.undo()
    setFen(game.fen())
    setcurrentNode(parentNode)
    setpgnView(treeToPGN(moveTree))
  }

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    if (moveTree == null) {
      const rootNode = new treeNode('root')
      setmoveTree(rootNode)
      setcurrentNode(rootNode)
    }
  }, [moveTree])

  useEffect(() => {
    const newbookMoves = []
    if(currentNode){
      for(const child of currentNode.children){
        newbookMoves.push(child.move)
      }
      setbookMoves(newbookMoves)
    }
    const possibleMoves = game.moves({ verbose: true })
    const arrowMoves = []
    possibleMoves.forEach(move => {
      if(newbookMoves.includes(move.san)){
        arrowMoves.push([move.from, move.to, 'orange'])
      }
    })
    setbookMovesArrows(arrowMoves)
  }, [currentNode, game])

  useEffect(() => {
    checkGame() //sets up comments - currentNode always changes
    if(user && openings.length === 0 && Object.keys(hashComments).length === 0 ){
      getOpenings()
    }
    if(user && Object.keys(hashComments).length === 0){
      loadComment()
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => {window.removeEventListener("keydown", handleKeyPress)}
  }, [fen, hashComments, currentNode])

  return (
    <div className="mainDiv">

      <div className="leftPanel">
        <div className="loadedMoves"> 
          {bookMoves.map(elem => <p key={elem} style={{color : "white"}}>{elem}</p>)}
        </div>

        <div className="openings">
          {openings.map((item, index) => <p id={item.id} className={item.id == openingID ? "selectedOpening" : ""} key={index} onClick={() => selectOpening(item.id)}>{item.name}</p>)}
        </div>
      </div>

      <div className="board-container">
        <Chessboard 
          position={fen} 
          boardOrientation={orientation}
          //onPieceDrop={onDrop} 
          onSquareClick={onSquareClick}
          //onPieceDragBegin={onPieceDragBegin}
          customSquareStyles={optionSquares}    //available moves for clicked piece
          customArrows={bookMovesArrows}
        />

        <div className="buttons">
          <button className="btn-light" onClick={moveBack}><ArrowLeft /></button>
          <button className="btn-light" onClick={moveForward}><ArrowRight /></button>
          <button className="btn-light" onClick={() => {setOrientation(prevOrientation => (prevOrientation === "white" ? "black" : "white"))}}><ArrowDownUp /></button>
          <button className="btn-light" onClick={resetPosition}><ArrowClockwise /></button>
          <button className="btn-light" onClick={openingID ? saveOpening : openModal}>Save</button>
          <button className="btn-light" onClick={openModal}>Save As</button>
          <button className="btn-light" onClick={getOpenings}>Openings</button>
          <button className="btn-light" onClick={deleteMove}>Delete Move</button>
          {/* <button className="btn btn-light btn-sm mx-1" onClick={downloadtreeJSON}>Load</button> */}
        </div>
      </div>
      
      <div className="rightpanel">

        <div className="moveMades">
          <p>{pgnView}</p>
        </div>

        <div className="commentsDiv">
          <CommentBox comment={comment} setComment={setComment} position={fen} />
        </div>
        
        <div className="commentButtons">
          <button className="btn-light" onClick={saveComment}>Save</button>
          <button className="btn-light" onClick={loadComment}>Load</button>
          <button className="btn-light" onClick={deleteComment}>Delete</button>
        </div>

      </div>

      <SimpleModal isOpen={isModalOpen} onClose={closeModal} onSave={saveOpening} />

    </div>
  )
}