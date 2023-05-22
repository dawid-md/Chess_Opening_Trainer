import { Chessboard } from "react-chessboard";
import Board from "./PlayRandomMoveEngine";

export default function App() {
  return (
    <div className="mainDiv" style={{"width" : "480px"}}>
      {/* <Chessboard id="BasicBoard" /> */}
      <Board />
    </div>
  );
}
