import { useEffect, useState } from "react"
import { Chess } from "chess.js"
import { Chessboard } from "react-chessboard"
import CommentBox from "../Components/CommentBox"
import { treeNode } from "../treeNode"
import { treeToPGN } from "../treeNodePgn"
import { treeToJSON } from "../treeToJSON"
import useSound from "use-sound"
import moveSound from "../Sounds/Move.mp3"
import captureSound from "../Sounds/Capture.mp3"
import { getDatabase, ref, get, push, remove, update } from 'firebase/database'
import { app } from "../Config/firebase"  //this is important, don't comment it out

export default function Analysis() {
  const [game] = useState(new Chess())  //main representation of the board
  const [orientation, setOrientation] = useState("white")
  const [fen, setFen] = useState(game.fen())  //fen of current position, setFen triggers board refresh
  const [optionSquares, setOptionSquares] = useState({})  //available moves for current piece clicked
  const [moveFrom, setMoveFrom] = useState("")   //sets current clicked square (if legal move is possible from that square)
  const [hashComments, sethashComments] = useState({})
  const [comment, setComment] = useState({"position" : "", "comment" : "", commentID : ""})
  const [openings, setOpenings] = useState([])    //opening downloaded from database
  const [openingID, setOpeningID] = useState([""])  //id of the current opening that is selected by user and edited
  const [openingName, setopeningName] = useState("")  //name chosed before saving 
  const [savedMoves, setsavedMoves] = useState([])    //saved moves that application suggests with arrows
  const [moveArrows, setmoveArrows] = useState([])    //suggests saved moves

  const [moveTree, setmoveTree] = useState(null)
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

    return result        
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
    const fenPositionOnly = fen.split(' ').slice(0, 4).join(' ')

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
    sethashComments({})
  }

  const saveTreeJSON = async () => {      //upload tree json to database
    const db = getDatabase()
    const treesRef = ref(db, 'Trees')
    const result = treeToJSON(moveTree)
    result.name = openingName
    if(openingID == ""){
      try {
        await push(treesRef, result)  //upload whole result object
      } catch (error) {
        console.log(error)
      }
      setopeningName("")
    } else {
      const specificOpeningRef  = ref(db, `Trees/${openingID}`)
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
    const openingsRef = ref(db, 'Trees')
    try{
      const snapshot = await get(openingsRef)
      if(snapshot.exists()) {
        const data = snapshot.val()
        console.log(data);
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
          const keyPos = data[key]["position"].split(' ').slice(0, 4).join(' ')
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
      sethashComments(hashComments)
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
        console.log("comment updated");
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

  function onPieceDragBegin(piece, sourceSquare){
    const hasOptions = getMoveOptions(sourceSquare)
    if (hasOptions) {setMoveFrom(sourceSquare)}
  }

  const changeopeningName = (event) => {
    event.preventDefault()
    setopeningName(event.target.value)
  }

  useEffect(() => {
    console.log("rendered");
    if(moveTree == null){
      const rootNode = new treeNode('root')
      setmoveTree(rootNode)
      setcurrentNode(rootNode)
    }
    checkGame()

    const newsavedMoves = []
    if(currentNode){
      for(const child of currentNode.children){
        newsavedMoves.push(child.move)
      }
      setsavedMoves(newsavedMoves)
    }
    const possibleMoves = game.moves({ verbose: true })
    const arrowMoves = []
    possibleMoves.forEach(move => {   //changed from map
      if(newsavedMoves.includes(move.san)){
        arrowMoves.push([move.from, move.to, 'orange'])
      }
    })
    setmoveArrows(arrowMoves)

  }, [fen, hashComments, currentNode])

  return (
    <div className="mainDiv">

      <div className="leftPanel text-white">
        <div className="loadedMoves"> 
          {savedMoves.map(elem => <p key={elem} style={{color : "white"}}>{elem}</p>)}
        </div>

        <div className="openings">
          {openings.map((item, index) => <p id={item.id} key={index} onClick={() => selectOpening(item.id)}>{item.name}</p>)}
        </div>
      </div>

      <div className="w-75">
        <Chessboard 
          position={fen} 
          boardOrientation={orientation}
          onPieceDrop={onDrop} 
          onSquareClick={onSquareClick}
          onPieceDragBegin={onPieceDragBegin}
          customSquareStyles={optionSquares}    //available moves for clicked piece
          customArrows={moveArrows}
        />

        <div className="buttons">
          <button className="btn btn-light btn-sm mx-1" onClick={moveBack}>Undo</button>
          <button className="btn btn-light btn-sm mx-1" onClick={moveForward}>Next</button>
          <button className="btn btn-light btn-sm mx-1" onClick={resetPosition}>Reset</button>
          <button className="btn btn-light btn-sm mx-1" onClick={() => {setOrientation(prevOrientation => (prevOrientation === "white" ? "black" : "white"))}}>Flip Board</button>
          <button className="btn btn-light btn-sm mx-1" onClick={saveTreeJSON}>Save</button>
          <button className="btn btn-light btn-sm mx-1" data-bs-toggle="modal" data-bs-target="#myModal">Save As</button>
          <button className="btn btn-light btn-sm mx-1" onClick={getOpenings}>Openings</button>
          {/* <button className="btn btn-light btn-sm mx-1" onClick={downloadtreeJSON}>Load</button> */}
        </div>
      </div>
      
      <div className="rightpanel">

        <div className="moveMades text-white">
          <p>{pgnView}</p>
        </div>

        <div className="commentsDiv">
          <CommentBox comment={comment} setComment={setComment} position={fen} />
        </div>
        
        <div className="commentButtons text-center">
          <button className="btn btn-light btn-sm mx-2" onClick={saveComment}>Save</button>
          <button className="btn btn-light btn-sm" onClick={loadComment}>Load</button>
          <button className="btn btn-light btn-sm mx-2" onClick={deleteComment}>Delete</button>
        </div>

      </div>

      <div className="modal" id="myModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Opening Name</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <input type="text" onChange={changeopeningName} className="form-control" placeholder="Opening Name"/>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={saveTreeJSON}>Save</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}













//---------------------axios
  // const saveTreeJSON = async () => {      //upload tree json to database
  //   const result = treeToJSON(moveTree)
  //   result.name = openingName
  //   console.log(result);
  //   const res = await axios.post(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Trees.json`, result)
  //   setopeningName("")
  // }

    // async function deleteComment(){
  //   if(comment.commentID != ""){
  //     const res = await axios.delete(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Comments/${comment.commentID}.json`)
  //     loadComment()
  //   }
  // }

    // async function saveComment(){
  //   if(comment != ""){
  //     const res = await axios.post(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Comments.json`, comment)
  //     console.log("comment saved")
  //   } 
  //   else{ //update comment
  //     const res = await axios.patch(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Comments/${comment.commentID}.json`, {"comment" : comment.comment})
  //     console.log("comment updated")
  //   }
  //   loadComment()
  // }

    // async function loadComment(){
  //   const res = await axios.get(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Comments.json`)
  //   const hashComments = {}

  //   for(const key in res.data){
  //       const keyPos = res.data[key]["position"].split(' ').slice(0, 4).join(' ')
  //       if(!hashComments[keyPos]){ 
  //         hashComments[keyPos] = {
  //           "comment" : res.data[key]["comment"],
  //           "commentID" : key
  //         }
  //       }
  //   }
  //   sethashComments(hashComments)
  // }

    // async function getOpenings(){
  //   const res = await axios.get(`https://opening-trainer-default-rtdb.europe-west1.firebasedatabase.app/Trees.json`)
  //   const openingsArray = []
  //   for(const key of Object.keys(res.data)){
  //     const itemWithKey = {
  //       id: key,
  //       ...res.data[key]
  //     }
  //     openingsArray.push(itemWithKey)
  //   }
  //   setOpenings(openingsArray)
  // }