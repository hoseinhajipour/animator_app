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

function secondsToMilliseconds(seconds) {
    return seconds * 1000;
}


function findMorph(Manager, name) {
    for (let i = 0; i < Manager.numTargets; i++) {
        const morphTarget = Manager.getTarget(i);
        if (morphTarget.name === name) {
            return morphTarget;
        }
    }
    return null;
}

function secondsToFrames(seconds) {
    return Math.round(seconds * frameRate);
}


function millisecondsToFrames(milliseconds) {
    var seconds = milliseconds / 1000; // Convert milliseconds to seconds
    var frames = seconds * frameRate;
    return frames;
}

function framesToMilliseconds(frames) {
    var seconds = frames / frameRate;
    var milliseconds = seconds * 1000; // Convert seconds to milliseconds
    return milliseconds;
}
