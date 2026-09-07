
const productModel = require('../model/product.model');
const inventoryModel = require('../model/inventory.model');
const categoryModel=require("../model/category.model.js")
const  getOrSetRedis =require('../utils/getsetRedis.js');
const {main} = require('../bot/treebuilder.js');
const crypto = require("crypto");
const { redisClient } = require("../config/redis");




exports.fetchProduct=async(req,res)=>{
try{
const {productId,sessionId}=req.params;
if(!productId){
return res.status(400).json({
message:"ProductId is required"});
}

        if (sessionId) {
            const rawSession = await redisClient.get(
                `conversation:session:${sessionId}`
            );

            if (rawSession) {
                const sessionData = JSON.parse(rawSession);

                // Never trust sessionId alone
                if (sessionData.productId === productId) {

                    // Refresh 10-minute inactivity timeout
                    await redisClient.expire(
                        `conversation:session:${sessionId}`,
                        600
                    );

                    return res.status(200).json({
                        message: "Existing conversation restored",
                        sessionData
                    });
                }
            }
        }
const product=await productModel.findOne({_id:productId});
if(!product){
return res.status(404).json({
message:"Product not found"});
}
if(product.totalStock<=0){
return res.status(400).json({
message:"Product out of stock"});}
const data={
productName:product.name,
productDescription:product.description,
productImages:product.images,
primeAttribute:product.primeAttribute,
primeAttributeValues:product.primeAttribute.value,
categoryId:product.category,


}
res.status(200).json({
message:"Product fetched successfully",
data:data
});
return;
}
catch(err){
res.status(500).json({
message:"Internal server error"});


}}
exports.variantSelection = async (req, res) => {
    try {
        const {
            productId,
            attributeValues,
            categoryId,
        } = req.params;

        if (!productId  || !categoryId) {
            return res.status(400).json({
                message: "ProductId,  and categoryId are required"
            });
        }

        const key = `product:tree:${productId}`;
      

        const data = await getOrSetRedis(key, async () => {

            // 1. Get available variants
            const variants = await inventoryModel.find({
                productId,
               "inventory.availableStock": { $gt: 0 }
            })
            .select({
                attributes: 1,
                inventory: 1,
                price: 1
            })
            .lean();

            // 2. No variants
            if (variants.length === 0) {
                return null;
            }

            // 3. Get category attributes
            const category = await categoryModel.findById(categoryId)
                .select("attributes")
                .lean();

            if (!category) {
                throw new Error("Category not found");
            }

            // 4. Get attributes in canonical order
            const attributeKeys = [...category.attributes]
                .sort((a, b) => a.order - b.order)
                .map(attr => attr.key);
            // 5. Build variant tree
            return main(attributeKeys, variants);
        });

        // Cache miss callback found no variants
        if (!data) {
            return res.status(404).json({
                message: "No variants found for the given productId and categoryId"
            });
        }
   
   const    sessionId = `sess_${crypto.randomUUID()}`;
   console.log(data);
const sessionData={
productId:productId,
treeId:key,
sessionId:sessionId,
selection:[{
attribute:data.attribute,
value:attributeValues,
level:0

}],
currentNode:{
nodeKey:data.option[attributeValues].attribute,
nodeValue:data.option[attributeValues].option,
level:1
}


}
//save krlo above sessionData in redis with key as sessionId and expiration time of 30 mins
await redisClient.setEx( `conversation:session:${sessionId}`, 600, JSON.stringify(sessionData));






        return res.status(200).json({
            message: "Variants fetched successfully",
            data,
            sessionId,
            sessionData
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};