function find(index, tree, selection) {

    // All selections have been processed
    if (index >= selection.length) {

        // Leaf node / final variant
       if (
    tree.variantId !== undefined &&
    tree.price !== undefined &&
    tree.reservedStock !== undefined &&
    tree.availableStock !== undefined
) {
    return {
        status: 200,
        message: "Valid variant",

        variantId: tree.variantId,
        price: tree.price,

        // Snapshot only — inventory DB remains source of truth
        reservedStock: tree.reservedStock,
        availableStock: tree.availableStock,

        level: index
    };
}
        // Valid path, but not a final variant
        return {
            status: 300,
            message: "Selection processed successfully",
            attribute: tree.attribute,
            option: tree.option,
            level: index
        };
    }

    const treeAttribute = selection[index].attribute;
    const treeValue = selection[index].value;

    if (treeAttribute !== tree.attribute) {
        return {
            status: 404,
            message: "Invalid attribute",
            attribute: tree.attribute,
            option: tree.option,
            level: index
        };
    }

    if (!(treeValue in tree.option)) {
        return {
            status: 404,
            message: "Invalid selection",
            attribute: treeAttribute,
            option: tree.option,
            level: index
        };
    }

    // IMPORTANT: return recursive result
    return find(
        index + 1,
        tree.option[treeValue],
        selection
    );
}

export function main(tree,selection){
let index=0;
let resut=find(index,tree,selection);
return resut;


}