export class treeNode {
    constructor(obj) {
        if(obj == 'root'){
            this.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        }
        else{
            this.move = obj.san
            this.fen = obj.after;
        }
        this.children = []
    }
    addChild(node) {
        this.children.push(node)
    }
}