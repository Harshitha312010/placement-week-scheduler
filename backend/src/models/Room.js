const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    capacity: {
        type: Number,
        default: 1
    },

    status: {
        type: String,
        enum: ["AVAILABLE", "UNAVAILABLE"],
        default: "AVAILABLE"
    }

}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);