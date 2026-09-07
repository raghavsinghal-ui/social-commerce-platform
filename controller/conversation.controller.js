// const {redisClient} = require('../config/redis');
// const {main}=require("../bot/findIndexTree.js");
// exports .continueConversation = async (req, res) => {
//     try {
//         const { sessionId, attribute,selection } = req.body;
// if (!sessionId || !attribute || !selection) {
//             return res.status(400).json({
//                 message: "sessionId, attribute and selection are required"
//             });
//         }
// const rawSession = await redisClient.get(`conversation:session:${sessionId}`);
//         if (!rawSession) {
//             return res.status(404).json({
//                 message: "Session not found or expired"
//             });
//         }
   
      
// const sessionData = JSON.parse(rawSession);
//      let tree=await redisClient.get(sessionData.treeId);
// if(sessionData.currentNode.nodeKey===attribute&&sessionData.currentNode.nodeValue.includes(selection)){
//        //valid selection, update the session data
//   sessionData.selection.push({
//     attribute,
//     selection,
//     level: sessionData.currentNode.level 
// });

// }
// else{
// const index = sessionData.selection.findIndex(
//     item => item.attribute === attribute
// );

// if (index !== -1) {
//     sessionData.selection.splice(index + 1);
// }

//   }

// const result = main(tree, sessionData.selection);






// }
//     catch (err) {
//         console.error("Error in continueConversation:", err);
//         res.status(500).json({
//             message: "Internal server error"
//         });
//     }
// }

const { redisClient } = require("../config/redis");
const { main } = require("../bot/findIndexTree.js");

exports.continueConversation = async (req, res) => {

    try {

        const { sessionId, attribute, selection } = req.body;

        // --------------------------------
        // 1. Validate request
        // --------------------------------

        if (!sessionId || !attribute || selection === undefined) {
            return res.status(400).json({
                message: "sessionId, attribute and selection are required"
            });
        }


        // --------------------------------
        // 2. Get session
        // --------------------------------

        const sessionKey = `conversation:session:${sessionId}`;

        const rawSession = await redisClient.get(sessionKey);

        if (!rawSession) {
            return res.status(404).json({
                message: "Session not found or expired"
            });
        }

        const sessionData = JSON.parse(rawSession);


        // --------------------------------
        // 3. Get tree
        // --------------------------------

        const rawTree = await redisClient.get(sessionData.treeId);

        if (!rawTree) {
            return res.status(404).json({
                message: "Variant tree not found"
            });
        }

        const tree = JSON.parse(rawTree);


        // --------------------------------
        // 4. Add/update user's selection
        // --------------------------------

        if (
            sessionData.currentNode &&
            sessionData.currentNode.nodeKey === attribute &&
            selection in sessionData.currentNode.nodeValue
        ) {

            // User selected an option from
            // the current node

            sessionData.selection.push({
                attribute,
                value: selection,
                level: sessionData.currentNode.level
            });

        } else {

            // User is changing an already
            // selected attribute

            const index = sessionData.selection.findIndex(
                item => item.attribute === attribute
            );

            if (index === -1) {
                return res.status(400).json({
                    message: "Invalid selection flow"
                });
            }

            // Remove this attribute and every
            // selection after it

            sessionData.selection.splice(index);

            // Add new value

            sessionData.selection.push({
                attribute,
                value: selection,
                level: index
            });
        }


        // --------------------------------
        // 5. Run tree traversal
        // --------------------------------

        const result = main(
            tree,
            sessionData.selection
        );


        // ========================================
        // 6. INVALID SELECTION
        // ========================================

        if (result.status === 404) {

            /*
             * Find the invalid attribute inside
             * the stored selection.
             */

            const index = sessionData.selection.findIndex(
                item => item.attribute === result.attribute
            );

            if (index !== -1) {

                /*
                 * Remove invalid selection AND
                 * everything after it.
                 */

                sessionData.selection.splice(index);
            }


            /*
             * Restore conversation to the node
             * where the user needs to make a
             * valid choice.
             */

            sessionData.currentNode = {
                nodeKey: result.attribute,
                nodeValue: Object.keys(result.option),
                level: result.level
            };


            // Refresh session TTL to 10 minutes

            await redisClient.set(
                sessionKey,
                JSON.stringify(sessionData),
                {
                    EX: 600
                }
            );


            return res.status(404).json({
                status: 404,
                message: result.message,

                currentNode: sessionData.currentNode,
                selection: sessionData.selection
            });
        }


        // ========================================
        // 7. PARTIAL VALID SELECTION
        // ========================================

        if (result.status === 300) {

            /*
             * Selection path is valid but we
             * haven't reached the final variant.
             */

            sessionData.currentNode = {
                nodeKey: result.attribute,
                nodeValue: Object.keys(result.option),
                level: result.level
            };


            // Refresh TTL

            await redisClient.set(
                sessionKey,
                JSON.stringify(sessionData),
                {
                    EX: 600
                }
            );


            return res.status(200).json({
                status: 300,
                message: "Selection accepted",

                currentNode: sessionData.currentNode,
                selection: sessionData.selection
            });
        }


        // ========================================
        // 8. FINAL VARIANT
        // ========================================

        if (result.status === 200) {

            /*
             * Complete valid variant selected.
             *
             * Conversation tree is finished.
             */

            sessionData.currentNode = null;


            // Refresh TTL

            await redisClient.set(
                sessionKey,
                JSON.stringify(sessionData),
                {
                    EX: 600
                }
            );


            return res.status(200).json({
                status: 200,
                message: "Valid variant",

                variantId: result.variantId,
                price: result.price,

                stock: result.availableStock,
                reservedStock: result.reservedStock,

                selection: sessionData.selection,
                currentNode: null
            });
        }


        // --------------------------------
        // Unexpected status
        // --------------------------------

        return res.status(500).json({
            message: "Unexpected result from tree traversal"
        });

    }

    catch (err) {

        console.error(
            "Error in continueConversation:",
            err
        );

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

