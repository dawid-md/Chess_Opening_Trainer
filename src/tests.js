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

        if (i === 0) {
            if(!Number.isInteger(movePair) && dots === ".."){
                result += Math.floor(movePair) + "." + dots
            } 
            else if(Number.isInteger(movePair) && dots === ""){
                result += Math.floor(movePair) + "." + dots
            }
            //result += movePair + "." + dots
            result += " "
            movePair += 0.5
            result += `${child.move} `;
        } else {
            movePair -= 0.5
            dots = Number.isInteger(movePair) ? "" : ".."
            result += `(${Math.floor(movePair) + "." + dots + " " + child.move}`;
            //result += `(${movePair + "." + dots + " " + child.move}`;
            movePair += 0.5
            const childResult = treeToPGN(child, true, movePair);
            result += childResult ? ` ${childResult}) ` : ') ';
            inBrackets = true   //here it only sets a flag that bracket has been closed and if next move is black then it should add dots 
        }
    }

    if (node.children.length > 0) {             // Recurse into the first child's descendants
        dots = inBrackets && !Number.isInteger(movePair) && result[result.length-2] === ")" ? ".." : ""
        result += treeToPGN(node.children[0], false, movePair, dots);
    }

    return result.trim();
}


    let root = new treeNode('root');
    let nf3 = new treeNode({ san: 'Nf3' }, root);
    let d5 = new treeNode({ san: 'd5' }, nf3);
    //let c5 = new treeNode({ san: 'c5' }, nf3);
    let d4 = new treeNode({ san: 'd4' }, d5);
    let c4 = new treeNode({ san: 'c4' }, d5);
    let nf6 = new treeNode({ san: 'Nf6' }, d4);

    root.addChild(nf3);
    nf3.addChild(d5);
    //nf3.addChild(c5);
    d5.addChild(d4);
    d5.addChild(c4);
    d4.addChild(nf6);

// 
// let d4 = new treeNode({ san: 'd4' }, root);
// let d5 = new treeNode({ san: 'd5' }, d4);
// let nf6 = new treeNode({ san: 'Nf6' }, d4);
// let c4 = new treeNode({ san: 'c4' }, nf6);
// let e6 = new treeNode({ san: 'e6' }, c4);

// root.addChild(d4);
// d4.addChild(d5);
//     d4.addChild(nf6);
// nf6.addChild(c4);
// c4.addChild(e6);



console.log(treeToPGN(root));


//-------------basic test------------------------let root = new treeNode('root');
    // let nf3 = new treeNode({ san: 'Nf3' }, root);
    // let d5 = new treeNode({ san: 'd5' }, nf3);
    // let c5 = new treeNode({ san: 'c5' }, nf3);
    // let d4 = new treeNode({ san: 'd4' }, d5);
    // let c4 = new treeNode({ san: 'c4' }, d5);
    // let nf6 = new treeNode({ san: 'Nf6' }, d4);

    // root.addChild(nf3);
    // nf3.addChild(d5);
    // nf3.addChild(c5);
    // d5.addChild(d4);
    // d5.addChild(c4);
    // d4.addChild(nf6);
//------------------------------------------------------------------------------



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


//the best version so far
// function treeToPGN(node, inBrackets = false, movePair = 1.0, dots = "") {
//     if (!node || !node.children) return "";

//     let result = "";

//     for (let i = 0; i < node.children.length; i++) {
//         const child = node.children[i];

//         if (i === 0) {
//             if(!Number.isInteger(movePair) && dots == ".."){
//                 result += Math.floor(movePair) + "." + dots
//             } 
//             else if(Number.isInteger(movePair) && dots == ""){
//                 result += Math.floor(movePair) + "." + dots
//             }
//             //result += movePair + "." + dots
//             result += " "
//             movePair += 0.5
//             result += `${child.move} `;
//         } else {
//             movePair -= 0.5
//             dots = Number.isInteger(movePair) ? "" : ".."
//             result += `(${Math.floor(movePair) + "." + dots + " " + child.move}`;
//             //result += `(${movePair + "." + dots + " " + child.move}`;
//             movePair += 0.5
//             const childResult = treeToPGN(child, true, movePair);
//             result += childResult ? ` ${childResult}) ` : ') ';
//             inBrackets = true
//         }
//     }

//     if (node.children.length > 0) {             // Recurse into the first child's descendants
//         console.log(result[result.length-2]);
//         dots = inBrackets && !Number.isInteger(movePair) && result[result.length-2] === ")" ? ".." : ""
//         result += treeToPGN(node.children[0], false, movePair, dots);
//     }

//     return result.trim();
// }