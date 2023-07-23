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

let pgnTree = {
    move: "startingPosition",
    children: [
      {
        move: "Nf3",
        children: [
          {
            move: "d5",
            children: [
              {
                move: "d4",
                children: [              
                  {
                    move: "Nf6",
                    children: []
                  }
                ]
              },
              {
                move: "c4",
                children: []
              }
            ]
          }
        ]
      }
    ]
}

function treeToPGN(node, depth = -1) {
  let pgn = '';
  let isFollowingVariation = false;

  if (depth % 2 === 0) {
      const moveNumber = Math.floor(depth / 2) + 1;
      pgn += `${moveNumber}. `;
  } else if (node.parent && node.parent.children.length > 1 && node === node.parent.children[1]) {
      // Check if the current node is a direct child of a node with more than one child
      // (indicating it's following a variation).
      isFollowingVariation = true;
      const moveNumber = Math.floor((depth + 1) / 2);
      pgn += `${moveNumber}... `;
  }

  if (node.move) {
      pgn += node.move + ' ';
  }

  if (node.children.length == 1) {
      let mainLine = treeToPGN(node.children[0], depth + 1);
      pgn += mainLine;

      if (node.children.length > 1) {
          let variations = node.children.slice(1).map(child => `(${treeToPGN(child, depth + 1)})`).join(' ');
          pgn += ' ' + variations;
      }
  }

  return pgn.trim();
}

let root = new treeNode('root');
let nf3 = new treeNode({ san: 'Nf3' }, root);
let d5 = new treeNode({ san: 'd5' }, nf3);
let d4 = new treeNode({ san: 'd4' }, d5);
let nf6 = new treeNode({ san: 'Nf6' }, d4);
let c4 = new treeNode({ san: 'c4' }, d5);

root.addChild(nf3);
nf3.addChild(d5);
d5.addChild(d4);
d5.addChild(c4);
d4.addChild(nf6);

console.log(treeToPGN(root));