const mongoose = require("mongoose");
const inventorySchema = new mongoose.Schema(
{
productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        required:true,
    }
,
attributeString:{
    type:String,
    required:true
},
attributes:[{
key:{
    type:String,
    required:true,
    trim:true,
    lowercase:true
},
value:{
    type:mongoose.Schema.Types.Mixed,
    required:true

}



}],
inventory:{
availableStock:{
    type:Number,
    required:true,
    min:0
},
reservedStock:{
    type:Number,
    required:true,
    min:0 
}





},
price:{
type:Number,
required:true,
min:0
}





},
 
 );
inventorySchema.index({productId:1});
// inventorySchema.index({productId:1,attributeString:1},{unique:true});
module.exports=mongoose.model('inventory',inventorySchema);