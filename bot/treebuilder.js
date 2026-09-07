
function builder(index, order, combination) {

    // Last node = exact variant
    if (index >= order.length) {

        const variant = combination[0];

        return {
            variantId: variant._id,

            availableStock: variant.inventory.availableStock,
            reservedStock: variant.inventory.reservedStock,

            price: variant.price
        };
    }

    const fltr = order[index];

    const vals = new Set();

    for (const comb of combination) {

        const attribute = comb.attributes.find(
            attrs => attrs.key === fltr
        );

        if (attribute) {
            vals.add(attribute.value);
        }
    }

    const node = {
        attribute: order[index],
        option: {}
    };

    for (const val of vals) {

        const newArr = combination.filter(comb => {

            const attribute = comb.attributes.find(
                attrs => attrs.key === fltr
            );

            return attribute && attribute.value === val;
        });

        node.option[val] = builder(
            index + 1,
            order,
            newArr
        );
    }

    return node;
}


export function main(order, combination) {

    return builder(0, order, combination);
}

