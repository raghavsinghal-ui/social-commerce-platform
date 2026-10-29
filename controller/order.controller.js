
const mongoose = require("mongoose");

const Order = require("../model/order.model");
const Inventory = require("../model/inventory.model");
const redisClient  = require("../config/redis");


exports.reserveOrder = async (req, res) => {

    const { sessionId, variantId, quantity } = req.body;

    // -----------------------------------------
    // 1. Validate request
    // -----------------------------------------

    if (!sessionId || !variantId || quantity === undefined) {
        return res.status(400).json({
            message: "sessionId, variantId and quantity are required"
        });
    }

    if (quantity <= 0) {
        return res.status(400).json({
            message: "Quantity must be greater than 0"
        });
    }


    // -----------------------------------------
    // 2. Restore session from Redis
    // -----------------------------------------

    const redisKey = `conversation:session:${sessionId}`;

    const sessionData = await redisClient.get(redisKey);

    if (!sessionData) {
        return res.status(404).json({
            message: "Session expired or not found"
        });
    }

    const userSession = JSON.parse(sessionData);

    const userId = userSession.userId;

    if (!userId) {
        return res.status(400).json({
            message: "Invalid session"
        });
    }


    // -----------------------------------------
    // 3. Start MongoDB session
    // -----------------------------------------

    const mongoSession = await mongoose.startSession();

    try {

        let createdOrder;


        // -----------------------------------------
        // 4. Start transaction
        // -----------------------------------------

        await mongoSession.withTransaction(async () => {


            // -----------------------------------------
            // 5. Find inventory/variant
            // -----------------------------------------

            const inventory = await Inventory.findOne({
                _id: variantId
            }).session(mongoSession);


            if (!inventory) {
                throw new Error("Variant/inventory not found");
            }


            // -----------------------------------------
            // 6. Atomically reserve stock
            // -----------------------------------------

            const updatedInventory =
                await Inventory.findOneAndUpdate(

                    {
                        _id: variantId,

                        // Only reserve when enough stock exists
                        "inventory.availableStock": {
                            $gte: quantity
                        }
                    },

                    {
                        $inc: {
                            "inventory.availableStock": -quantity,
                            "inventory.reservedStock": quantity
                        }
                    },

                    {
                        new: true,
                        session: mongoSession
                    }
                );


            if (!updatedInventory) {
                throw new Error("Insufficient inventory");
            }


            // -----------------------------------------
            // 7. Reservation time
            // -----------------------------------------

            const reservationDate = new Date();

            const expiresAt = new Date(
                reservationDate.getTime() +
                15 * 60 * 1000
            );


            // -----------------------------------------
            // 8. Calculate amount
            // -----------------------------------------

            const unitPrice = inventory.price;

            const totalAmount = unitPrice * quantity;


            // -----------------------------------------
            // 9. Create order
            // -----------------------------------------

            const orders = await Order.create(
                [
                    {
                        user: userId,

                        product: inventory.productId,

                        variant: variantId,

                        quantity: quantity,

                        unit: "piece",

                        unitPrice: unitPrice,

                        totalAmount: totalAmount,

                        reservationDate: reservationDate,

                        expiresAt: expiresAt,

                        paymentStatus: "pending",

                        orderStatus: "pending"
                    }
                ],
                {
                    session: mongoSession
                }
            );


            createdOrder = orders[0];

        });


        // -----------------------------------------
        // 10. Transaction committed
        // -----------------------------------------

        return res.status(201).json({
            message: "Order reserved successfully",
            order: createdOrder
        });


    } catch (error) {

        console.error("Reserve order error:", error);

        return res.status(400).json({
            message: error.message
        });


    } finally {

        // -----------------------------------------
        // 11. End MongoDB session
        // -----------------------------------------

        await mongoSession.endSession();
    }
};