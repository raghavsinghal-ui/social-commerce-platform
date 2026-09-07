const mongoose=require('mongoose');
const productSchema=new mongoose.Schema({
storeId:{
type:mongoose.Schema.Types.ObjectId,
ref:'Store',
required:true,
},
primeAttribute:{
key:{
    type:String,
    required:true,
    trim:true,
    lowercase:true
},
value:{
    type:[mongoose.Schema.Types.Mixed],
    required:true
}


},
category:{
type:mongoose.Schema.Types.ObjectId,
ref:'Category',
required:true,
},
name:{
type:String,
required:true,
},
description:{
type:String,
required:true
},

images:{
    type:[String],

},
totalStock:{
    type:Number,
    required:true

}


});
module.exports=mongoose.model('product',productSchema);