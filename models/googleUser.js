const mongoose = require('mongoose');

const googleUserSchema = mongoose.Schema({
    email : {
        type: String,
        required: true
    },
    username : {
        type: String,
        required: true
    },
    selectedPlan : {
        type: String,
    },
    totalCredits : {
        type: Number,
        default: 0,
    }
})

const GoogleUser = mongoose.model("GoogleUser", googleUserSchema);
module.exports = GoogleUser;