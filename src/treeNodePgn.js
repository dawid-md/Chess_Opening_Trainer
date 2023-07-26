export function treeToPGN(node, inBrackets = false, movePair = 1.0, dots = "") {
    if (!node || !node.children) return "";

    let result = "";

    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];

        if (i === 0) {
            if(!Number.isInteger(movePair) && dots == ".."){
                result += Math.floor(movePair) + "." + dots
            } 
            else if(Number.isInteger(movePair) && dots == ""){
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
            inBrackets = true
        }
    }

    if (node.children.length > 0) {             // Recurse into the first child's descendants
        //console.log(result[result.length-2]);
        dots = inBrackets && !Number.isInteger(movePair) && result[result.length-2] === ")" ? ".." : ""
        result += treeToPGN(node.children[0], false, movePair, dots);
    }

    return result.trim();
}


