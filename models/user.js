const mongoose = require("mongoose");

const userSchema = mongoose.Schema({

    username : {
        type: String,
    },
    email : {
        type: String,
        required: true
    },
    password : {
        type: String,
        required: true
    },
    confirmPassword : {
        type: String,
    },
    userID : {
        type : String,
        required: true,
        unique: true,
    },
    refreshToken: {
        type : [String],
    },
    selectedPlan : {
        type: String, 
    },
    totalCredits : {
        type: Number,
        default: 0,
    },
})

const User = mongoose.model("User", userSchema);
module.exports = User;
