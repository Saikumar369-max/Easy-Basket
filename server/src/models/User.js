const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'owner'],
        default: 'user',
    },
    address: {
        street : {
            type : String,
            required : true
        },
        city : {
            type : String,
            required : true
        },
        state : {
            type : String,
            required : true
        },
    },
    createdAt : {
        type : Date,
        default : Date.now
    },
    refreshToken : {
        type : String,
        default : ""
    }
});

module.exports = mongoose.model('User', userSchema);
