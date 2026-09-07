const mongoose = require("mongoose");

const attributeSchema = new mongoose.Schema(
{
    key:{
        type:String,
        required:true,
        trim:true,
        lowercase:true
    },

    label:{
        type:String,
        required:true,
        trim:true
    },

    type:{
        type:String,
        enum:[
            "TEXT",
            "NUMBER",
            "BOOLEAN",
            "DATE",
            "SELECT",
            "MULTISELECT"
        ],
        required:true
    },

    required:{
        type:Boolean,
        default:true
    },

    validation:{
        min:Number,
        max:Number,

        minLength:Number,
        maxLength:Number,

        regex:String,

        options:[mongoose.Schema.Types.Mixed]
    },

    unit:{
        type:String,
        default:null
    },

    placeholder:{
        type:String,
        default:""
    },

    helpText:{
        type:String,
        default:""
    },

    order:{
        type:Number,
        default:0
    }
},
{_id:false}
);


const categorySchema=new mongoose.Schema({

    name:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        maxlength:120
    },

    attributes:[attributeSchema],

    status:{
        type:String,
        enum:["ACTIVE","INACTIVE"],
        default:"ACTIVE"
    }

},{
    timestamps:true
});

module.exports=mongoose.model("Category",categorySchema);