const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },

    panel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Panel"
    },

    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room"
    },

    day: {
        type: Number,
        required: true
    },

    startTime: {
        type: String,
        required: true
    },

    endTime: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: [
            "SCHEDULED",
            "MOVED",
            "CANCELLED",
            "UNSCHEDULED",
            "COMPLETED"
        ],
        default: "SCHEDULED"
    },

    originalStartTime: String,
    originalRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room"
    },
    originalPanel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Panel"
    }

}, { timestamps: true });

module.exports = mongoose.model("Interview", interviewSchema);