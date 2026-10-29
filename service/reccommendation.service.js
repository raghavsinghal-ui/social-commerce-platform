
const { redisClient } = require("../config/redis");

async function buildRecommendationPath(tree) {
    if (!tree || !tree.nodeId) {
        throw new Error("Invalid variant tree");
    }

    const recommendationMap = {};

    async function dfs(node, path, projectedUsers = 0) {
        // Count sessions currently waiting at this node.
        const actualUsers = Number(
            await redisClient.sCard(
                `node:${node.nodeId}:sessions`
            )
        );

        // Actual sessions plus estimated incoming traffic.
        const usersHere = actualUsers + projectedUsers;

        // Final variant leaf.
        if (node.variantId) {
            const availableStock =
                Number(node.availableStock) || 0;

            const reservedStock =
                Number(node.reservedStock) || 0;

            // One additional customer from recommendation.
            const demand = usersHere + 1;

            const availableCoverage = Math.min(
                1,
                availableStock / demand
            );

            const reservedCoverage = Math.min(
                1,
                reservedStock / demand
            );

            // Available stock has priority over reserved stock.
            const score =
                0.7 * availableCoverage +
                0.3 * reservedCoverage;

            const completePath = [
                ...path,
                `variant=${node.variantId}`
            ].join("/");

            recommendationMap[completePath] = score;
            return;
        }

        // Pruning maintains the viable-branch invariant.
        const children = Object.entries(node.option || {});

        if (children.length === 0) return;

        // Equal traffic distribution across remaining children.
        const usersPerChild = usersHere / children.length;

        for (const [value, child] of children) {
            await dfs(
                child,
                [...path, `${node.attribute}=${value}`],
                usersPerChild
            );
        }
    }

    await dfs(tree, []);

    return recommendationMap;
}

module.exports = { buildRecommendationPath };
