const mongoose = require("mongoose");

const disruptionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [
            "COMPANY_DELAY",
            "PANEL_DROP",
            "STUDENT_WITHDRAWAL",
            "ROOM_UNAVAILABLE"
        ],
        required: true
    },

    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company"
    },

    panel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Panel"
    },

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    },

    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room"
    },

    delayHours: {
        type: Number,
        default: 0
    },

    description: String

}, { timestamps: true });

module.exports = mongoose.model("Disruption", disruptionSchema);