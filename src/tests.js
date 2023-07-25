class treeNode {
  constructor(result, parent = null) {
      if (result == 'root') {
          this.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      } else {
          this.move = result.san;
          this.fen = result.after;
          this.parent = parent;
      }
      this.children = [];
  }

  addChild(node) {
      node.parent = this;
      this.children.push(node);
  }
}

function treeToPGN(node, inBrackets = false, movePair = 1.0, dots = "") {
    if (!node || !node.children) return "";

    let result = "";

    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];

        if (i === 0 || inBrackets) {
            //if(!Number.isInteger(movePair) && dots == ".."){
                result += Math.floor(movePair) + "." + dots
            //} 
            //else if(Number.isInteger(movePair) && dots == ""){
                //result += Math.floor(movePair) + "." + dots
            //}
            result += " "
            movePair += 0.5
            result += `${child.move} `;
        } else {
            movePair -= 0.5
            dots = Number.isInteger(movePair) ? "" : ".."
            result += `(${Math.floor(movePair) + "." + dots + " " + child.move}`;
            movePair += 0.5
            const childResult = treeToPGN(child, true, movePair);
            result += childResult ? ` ${childResult}) ` : ') ';
            inBrackets = true
        }
    }

    if (node.children.length > 0) {             // Recurse into the first child's descendants
        dots = inBrackets && !Number.isInteger(movePair) ? ".." : ""
        result += treeToPGN(node.children[0], false, movePair, dots);
    }

    return result.trim();
}

let root = new treeNode('root');
let nf3 = new treeNode({ san: 'Nf3' }, root);
let d5 = new treeNode({ san: 'd5' }, nf3);
let c5 = new treeNode({ san: 'c5' }, nf3);
let d4 = new treeNode({ san: 'd4' }, d5);
let c4 = new treeNode({ san: 'c4' }, d5);
//let g3 = new treeNode({ san: 'g3' }, d5);
let nf6 = new treeNode({ san: 'Nf6' }, d4);
//let h6 = new treeNode({ san: 'h6' }, c4);
//let h3 = new treeNode({ san: 'h3' }, h6);

root.addChild(nf3);
nf3.addChild(d5);
nf3.addChild(c5);
d5.addChild(d4);
d5.addChild(c4);
//d5.addChild(g3);
d4.addChild(nf6);
//c4.addChild(h6);
//h6.addChild(h3);


console.log(treeToPGN(root));






// function treeToPGN(node, depth = -1) {
//   let pgn = '';

//   if (depth % 2 === 0) {
//       const moveNumber = Math.floor(depth / 2) + 1;
//       pgn += `${moveNumber}. `;
//     }

//   if (node.move) {
//       pgn += node.move + ' ';
//       //console.log(node.move);
//   }

//   //console.log(node.children);

//   node.children.forEach(child => {
//     console.log(child.move)
//     if(node.children.length > 1){
//       console.log(node.children[1].move)
//       treeToPGN(node.children[1])
//     }
//     treeToPGN(child, depth+1)
//   })

//   //console.log(node.children);

//   // if (node.children.length > 0) {
//   //   if (node.children.length == 1) {
//   //     let line = treeToPGN(node.children[0], depth + 1);
//   //     pgn += line;
//   //   } else if (node.children.length > 1) {
//   //     let variations = node.children.slice(1).map(child => `(${treeToPGN(child, depth + 1)})`).join(' ');
//   //     pgn += ' ' + variations;
//   //   }
//   // } 

//   //return pgn.trim();
// }





// let pgnTree = {
//     move: "startingPosition",
//     children: [
//       {
//         move: "Nf3",
//         children: [
//           {
//             move: "d5",
//             children: [
//               {
//                 move: "d4",
//                 children: [              
//                   {
//                     move: "Nf6",
//                     children: []
//                   }
//                 ]
//               },
//               {
//                 move: "c4",
//                 children: []
//               }
//             ]
//           }
//         ]
//       }
//     ]
// }