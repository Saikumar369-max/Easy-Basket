const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    shopId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Shop"
    },
    categoryId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Category"
    },
    name : {type : String, required : true},
    price : {
        mrp : {type : Number},
        sellingprice : {type : Number},
        discount : {type : Number}
    },
    description : {type : String, required : true},
    shortDescription : {type : String, required : true},
    image : {
        url : {type : String, required : true},
        public_id : {type : String, required : true}
    },
    stock : {
        quantity : {type : Number},
        unit : {type : String}
    },
    createdAt : {
        type : Date,
        default : Date.now
    },
    isActive : {
        type : Boolean,
        default : true
    }
});

module.exports = mongoose.model("Product", productSchema);
