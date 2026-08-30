const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    rollNumber: {
        type: String,
        required: true,
        unique: true
    },

    cgpa: {
        type: Number,
        required: true
    },

    branch: {
        type: String,
        required: true
    },

    shortlistedCompanies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company"
    }],

    status: {
        type: String,
        enum: ["ACTIVE", "WITHDRAWN", "PLACED"],
        default: "ACTIVE"
    }

}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);