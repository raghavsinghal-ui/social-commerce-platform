// const {rebuildTreeAfterInventoryChange} = require("../treeOperation/treePruning");
// const { buildRecommendationPath}=require("../service/reccommendation.service");
// const { redisClient } = require("../config/redis");
// export async function batchProcessing(sealedBatch) {
//   const productTasks = Object.entries(sealedBatch).map(
//     async ([productId, variants]) => {
//       for (const [variantId, stockInfo] of Object.entries(variants)) {
//         await rebuildTreeAfterInventoryChange(variantId, productId, stockInfo.latestState, stockInfo.selectionPath);
//       }
//         const treeKey =
//             `product:tree:${productId}`;
//       const tree = await redisClient.get(treeKey);
//       const parsedTree = JSON.parse(tree);
     
//      const recommendationPath = await buildRecommendationPath(parsedTree);
//     }
//   );

//   await Promise.all(productTasks);
// }
const {
    rebuildTreeAfterInventoryChange
} = require("../treeOperation/treePruning");

const {
    buildRecommendationPath
} = require("./reccommendation.service");

const {
    main: attributeToUser
} = require("./attributeToUser");

const {
    buildUserScoreMap
} = require("./buildScore");

const { redisClient } = require("../config/redis");

async function batchProcessing(sealedBatch) {
    const productTasks = Object.entries(sealedBatch).map(
        async ([productId, variants]) => {
            const treeKey = `product:tree:${productId}`;

            // 1. Load the original tree once.
            const rawTree = await redisClient.get(treeKey);

            if (!rawTree) {
                return {
                    productId,
                    error: "Product tree not found"
                };
            }

            let workingTree = JSON.parse(rawTree);
            const affectedSessions = new Set();

            // 2. Apply every inventory change to the in-memory tree.
            for (const [variantId, stockInfo] of Object.entries(variants)) {
                const result = await rebuildTreeAfterInventoryChange(
                    variantId,
                    productId,
                    stockInfo.latestState,
                    stockInfo.selectionPath,
                    workingTree
                );

                if (result?.tree) {
                    workingTree = result.tree;
                }

                for (const sessionId of result?.affectedSessions ?? []) {
                    affectedSessions.add(sessionId);
                }
            }

            // 3. Save the final tree once, after all changes.
            await redisClient.set(
                treeKey,
                JSON.stringify(workingTree)
            );

            // 4. No affected users means no recommendation work is needed.
            if (affectedSessions.size === 0) {
                return {
                    productId,
                    affectedSessions: [],
                    tree: workingTree,
                    userScores: new Map()
                };
            }

            // 5. Generate recommendations in memory.
            const recommendationMap =
                await buildRecommendationPath(workingTree);

            // 6. Build the attribute-to-user map.
            const attributeMap = await attributeToUser(
                [...affectedSessions]
            );

            // 7. Calculate recommendation scores for affected users.
            const userScores = buildUserScoreMap(
                attributeMap,
                recommendationMap
            );

            return {
                productId,
                affectedSessions: [...affectedSessions],
                userScores
            };
        }
    );

    return Promise.all(productTasks);
}

module.exports = { batchProcessing };
      //notification service to notify users about inventory exhaustion and recommendation scores can be added here