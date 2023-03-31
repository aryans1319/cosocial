const mongoose = require('mongoose');

const contentSchema = mongoose.Schema({
    title : {
        type: String,
        required: true
    },
    description : {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true
    }
})

const Content = mongoose.model("Content", contentSchema);
module.exports = Content;