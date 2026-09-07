const express=require("express");
const app=express();
const Inventory=require("./model/inventory.model");
const cookieParser = require("cookie-parser");
const mongoose=require("mongoose");
const productRoutes=require("./routes/findProduct.routes");

app.use(cookieParser());
app.use(express.json());
app.use("/api/products", productRoutes);
module.exports=app;
// app.patch("/api/inventory/:productId", async (req, res) => {
//     try {
//         const { productId } = req.params;

// const start = performance.now();
//        const result = await Inventory.findOneAndUpdate(
//     {
//         productId: productId ,
//         "inventory.availableStock": { $gte: 1 }
//     },
//     {
//         $inc: {
//             "inventory.availableStock": -1
//         }
//     },
//     {
//         new: true
//     }
// )
// const dbTime = performance.now() - start;

// console.log("DB TIME:", dbTime);
// if(!result){
//     return res.status(409).json({
//         message: "No stock available"
//     });
// }


        // console.log(result.inventory.availableStock);

        // if (result.inventory.availableStock <= 0) {
        //     return res.status(409).json({
        //         message: "No stock available"
        //     });
        // }

        // result.inventory.availableStock -= 1;
        // result.inventory.reservedStock += 1;

        // await result.save();

//         res.status(200).json({
//             message: "Stock updated successfully"
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             message: "Internal server error"
//         });
//     }
// });  
