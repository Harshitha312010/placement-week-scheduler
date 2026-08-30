const mongoose = require("mongoose");

const panelSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },

    name: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["AVAILABLE", "DROPPED"],
        default: "AVAILABLE"
    }

}, { timestamps: true });

module.exports = mongoose.model("Panel", panelSchema);