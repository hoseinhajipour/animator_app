function searchForBlendShape(node) {
    // Check if the current node has a blend shape

    if (node.morphTargetManager) {
        // If the node has a blend shape, return it
        return node;
    } else {
        // If the current node does not have a blend shape, check its children
        if (node.getChildren) {
            // Iterate through the child nodes
            for (let i = 0; i < node.getChildren().length; i++) {
                const childNode = node.getChildren()[i];
                // Recursively search for blend shape in child nodes
                const result = searchForBlendShape(childNode);
                // If a node with blend shape is found, return it
                if (result) {
                    return result;
                }
            }
        }
        // If no child node has blend shape, return null
        return null;
    }
}