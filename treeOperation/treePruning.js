
function rebuildTreeAfterInventoryChange(
    tree,
    selection,
    latestState
) {
    if (!tree || !Array.isArray(selection) || !latestState) {
        throw new Error("Invalid pruning arguments");
    }

    const { variantId, availableStock, reservedStock } = latestState;

    if (
        !Number.isFinite(availableStock) ||
        !Number.isFinite(reservedStock) ||
        availableStock < 0 ||
        reservedStock < 0
    ) {
        throw new Error("Invalid inventory state");
    }

    // 1. Traverse the tree and save parent-child relationships.
    let currentNode = tree;
    const stack = [];

    for (const step of selection) {
        const { value, nodeId } = step;

        const childNode = currentNode.option?.[value];

        if (!childNode) {
            throw new Error(
                `Selection option "${value}" not found in tree`
            );
        }

        // Validate the stored node ID when available.
        if (nodeId && childNode.nodeId !== nodeId) {
            throw new Error(
                `Stale node ID for selection "${value}"`
            );
        }

        stack.push({
            currentNode,
            option: value,
            childNode
        });

        currentNode = childNode;
    }

    // 2. Verify that we reached the correct variant leaf.
    if (
        !currentNode.variantId ||
        String(currentNode.variantId) !== String(variantId)
    ) {
        throw new Error("Selection path does not match variant");
    }

    // 3. Build the change object for the leaf.
    let change = null;

    if (availableStock > 0 || reservedStock > 0) {
        change = {
            ...currentNode,
            availableStock,
            reservedStock,
            price: latestState.price ?? currentNode.price
        };
    }

    // 4. Reconstruct the tree bottom-up.
    while (stack.length > 0) {
        const {
            currentNode: parentNode,
            option
        } = stack.pop();

        const updatedOptions = { ...parentNode.option };

        if (change === null) {
            // The child is empty, so remove this option.
            delete updatedOptions[option];
        } else {
            // The child still exists, so replace it.
            updatedOptions[option] = change;
        }

        // Never remove the root node.
        if (parentNode === tree) {
            change = {
                ...parentNode,
                option: updatedOptions
            };
            break;
        }

        // No children remain: this parent must also be removed.
        if (Object.keys(updatedOptions).length === 0) {
            change = null;
        } else {
            // Other branches remain, so preserve this parent.
            change = {
                ...parentNode,
                option: updatedOptions
            };
        }
    }

    return change ?? tree;
}

module.exports = { rebuildTreeAfterInventoryChange };
