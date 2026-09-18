const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
{
    name:{
        type:String,
        default:"Anonymous"
    },

    email:{
        type:String,
        unique:true,
        sparse:true
    },

    createdAt:{
        type:Date,
        default:Date.now
    }

},
{
    timestamps:true
});


module.exports = mongoose.model(
    "User",
    userSchema
);