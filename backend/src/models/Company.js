const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    priorityTier: {
        type: String,
        enum: ["TIER_1", "TIER_2", "TIER_3"],
        required: true
    },

    cgpaCutoff: {
        type: Number,
        required: true
    },

    interviewDuration: {
        type: Number,
        required: true
    },

    panelCount: {
        type: Number,
        required: true
    },

    shortlistedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }],

    availableDays: [{
        type: Number
    }]

}, { timestamps: true });

module.exports = mongoose.model("Company", companySchema);