// export function treeToJSON(node) {
//     const jsonNode = {
//         move: node.move,
//         fen: node.fen,
//         children: []
//     }
//     node.children.forEach(child => {
//         jsonNode.children.push(treeToJSON(child))
//     })
//     return jsonNode;
// }

// export function treeToJSON(node) {
//     const jsonNode = {
//         move: node.move,
//         fen: node.fen,
//         children: []
//     }
//     console.log(jsonNode);
//     node.children.forEach((child, index) => {
//         const childJson = treeToJSON(child);
//         jsonNode.children.push(childJson.id); // Store references to children
//         childJson.parent = jsonNode.id; // Store reference to parent
//     });
//     return jsonNode;
// }

let idCounter = 0;

function generateUniqueId() {
  return idCounter++;
}

export function treeToJSON(node) {
  let flatTree = {};

  function processNode(node) {
    const nodeId = generateUniqueId();
    const jsonNode = {
      move: node.move || null,
      fen: node.fen,
      children: []
    };

    // Recursively process children, storing their IDs in the children array
    node.children.forEach(child => {
      const childId = processNode(child);
      jsonNode.children.push(childId);
    });

    flatTree[nodeId] = jsonNode;

    return nodeId;
  }

  // Start the recursive processing with the root node
  const rootId = processNode(node);

  return { rootId, nodes: flatTree };
}