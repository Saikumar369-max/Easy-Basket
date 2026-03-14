const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    name : {type : String, required : true},
    ownerId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    phone : {type : String, required : true},
    address : {
        street : {type : String, required : true},
        city : {type : String, required : true},
        state : {type : String, required : true},
    },
    image : {
        url : {type : String, required : true},
        public_id : {type : String, required : true}
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

module.exports = mongoose.model('Shop', shopSchema);
