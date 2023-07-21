export function treeToPGN(node) {
    if (!node.move) {
        return handleMainLine(node.children[0], 1, true);
    } else {
        return '';
    }
}

function handleMainLine(node, moveNumber, isWhiteTurn) {
    if (!node) return '';

    let pgn = '';

    if (isWhiteTurn) {
        pgn += `${moveNumber}. ${node.move} `;
    } else {
        pgn += `${moveNumber}... ${node.move} `;
    }

    if (node.children.length > 1) {
        let variations = [];
        for (let i = 1; i < node.children.length; i++) {
            variations.push(handleVariation(node.children[i], moveNumber, !isWhiteTurn));
        }
        pgn += variations.join(' ') + ' ';
    }
    
    if (node.children.length > 0) {
        pgn += handleMainLine(node.children[0], isWhiteTurn ? moveNumber : moveNumber + 1, !isWhiteTurn);
    }

    return pgn.trim();
}

function handleVariation(node, moveNumber, isWhiteTurn) {
    let pgn = '';

    if (isWhiteTurn) {
        pgn += `(${moveNumber}. ${node.move} `;
    } else {
        pgn += `(${moveNumber}... ${node.move} `;
    }
    
    if (node.children.length > 0) {
        pgn += handleMainLine(node.children[0], isWhiteTurn ? moveNumber : moveNumber + 1, !isWhiteTurn) + ' ';
    }
    
    pgn += ')';
    return pgn.trim();
}

