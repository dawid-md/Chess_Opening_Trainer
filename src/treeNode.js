export class treeNode {
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