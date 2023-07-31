export function treeToJSON(node) {
    const jsonNode = {
        move: node.move,
        fen: node.fen,
        children: []
    };

    node.children.forEach(child => {
        jsonNode.children.push(treeToJSON(child));
    });

    return jsonNode;
}