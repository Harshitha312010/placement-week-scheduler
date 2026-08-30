const express = require("express");
const cors = require("cors");

const { generateDataset } = require("./utils/dataGenerator");
const { scheduleInterviews } = require("./services/scheduler");
const { validateSchedule } = require("./services/validator");
const { replanSchedule } = require("./services/replanner");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


let dataset = generateDataset();

let scheduleResult = scheduleInterviews(
    dataset.companies,
    dataset.students,
    dataset.rooms,
    dataset.panels
);

let validationResult = validateSchedule(
    scheduleResult.schedule,
    scheduleResult.unscheduled,
    dataset.rooms
);


    return dataset.students.find(
        student => student.name === name
    );
}

function findCompanyByName(name) {
    return dataset.companies.find(
        company => company.name === name
    );
}

function findPanelByName(name) {
    return dataset.panels.find(
        panel => panel.name === name
    );
}

function findRoomByName(name) {
    return dataset.rooms.find(
        room => room.name === name
    );
}

function refreshValidation() {
    validationResult = validateSchedule(
        scheduleResult.schedule,
        scheduleResult.unscheduled,
        dataset.rooms
    );
}


// ============================================================
// HEALTH
// ============================================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message:
            "Placement Week Scheduler API is running"
    });
});


// ============================================================
// DASHBOARD
// ============================================================

app.get("/api/dashboard", (req, res) => {

    res.json({
        success: true,

        data: {
            students:
                dataset.students.length,

            companies:
                dataset.companies.length,

            rooms:
                dataset.rooms.length,

            panels:
                dataset.panels.length,

            scheduled:
                scheduleResult.schedule.length,

            unscheduled:
                scheduleResult.unscheduled.length,

            schedulingPercentage:
                validationResult.metrics
                    .schedulingPercentage,

            roomUtilization:
                validationResult.metrics
                    .roomUtilization,

            validation: {
                valid:
                    validationResult.valid,

                studentConflicts:
                    validationResult
                        .studentConflicts.length,

                roomConflicts:
                    validationResult
                        .roomConflicts.length,

                panelConflicts:
                    validationResult
                        .panelConflicts.length,

                durationErrors:
                    validationResult
                        .durationErrors.length
            }
        }
    });
});


// ============================================================
// CURRENT SCHEDULE
// ============================================================

app.get("/api/schedule", (req, res) => {

    res.json({
        success: true,

        count:
            scheduleResult.schedule.length,

        schedule:
            scheduleResult.schedule
    });
});


// ============================================================
// UNSCHEDULED
// ============================================================

app.get("/api/unscheduled", (req, res) => {

    res.json({
        success: true,

        count:
            scheduleResult.unscheduled.length,

        unscheduled:
            scheduleResult.unscheduled
    });
});


// ============================================================
// REPLAN
// ============================================================

app.post("/api/replan", (req, res) => {

    try {

        const {
            type,
            studentName,
            companyName,
            panelName,
            roomName,
            delayHours
        } = req.body;


        if (!type) {
            return res.status(400).json({
                success: false,
                message:
                    "Disruption type is required."
            });
        }


        const disruption = {
            type
        };


        // ----------------------------------------------------
        // Resolve disruption target
        // ----------------------------------------------------

        if (
            type ===
            "STUDENT_WITHDRAWAL"
        ) {

            const student =
                findStudentByName(
                    studentName
                );

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student not found."
                });
            }

            disruption.studentId =
                student._id;
        }


        if (
            type ===
            "COMPANY_DELAY"
        ) {

            const company =
                findCompanyByName(
                    companyName
                );

            if (!company) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Company not found."
                });
            }

            disruption.companyId =
                company._id;

            disruption.delayHours =
                Number(delayHours) || 0;
        }


        if (
            type ===
            "PANEL_DROP"
        ) {

            const panel =
                findPanelByName(
                    panelName
                );

            if (!panel) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Panel not found."
                });
            }

            disruption.panelId =
                panel._id;
        }


        if (
            type ===
            "ROOM_UNAVAILABLE"
        ) {

            const room =
                findRoomByName(
                    roomName
                );

            if (!room) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Room not found."
                });
            }

            disruption.roomId =
                room._id;
        }


        // ----------------------------------------------------
        // Execute replan
        // ----------------------------------------------------

        const result =
            replanSchedule(
                scheduleResult.schedule,
                dataset.companies,
                dataset.rooms,
                dataset.panels,
                disruption
            );


        // ----------------------------------------------------
        // Save new schedule
        // ----------------------------------------------------

        scheduleResult.schedule =
            result.schedule;


        /*
         * Keep the original unscheduled requests and
         * add newly unscheduled replan requests.
         */
        scheduleResult.unscheduled = [
            ...scheduleResult.unscheduled,
            ...result.unscheduled
        ];


        refreshValidation();


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        return res.json({

            success: true,

            message:
                "Schedule replanned successfully.",

            disruption,

            summary:
                result.summary,

            changes:
                result.changes,

            unscheduled:
                result.unscheduled,

            affectedInterviewIds:
                result.affectedInterviewIds,

            validation: {
                valid:
                    validationResult.valid,

                studentConflicts:
                    validationResult
                        .studentConflicts.length,

                roomConflicts:
                    validationResult
                        .roomConflicts.length,

                panelConflicts:
                    validationResult
                        .panelConflicts.length,

                durationErrors:
                    validationResult
                        .durationErrors.length
            }
        });

    } catch (error) {

        console.error(
            "Replan error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to replan schedule.",
            error:
                error.message
        });
    }
});


// ============================================================
// RESET
// ============================================================

app.post("/api/reset", (req, res) => {

    dataset =
        generateDataset();

    scheduleResult =
        scheduleInterviews(
            dataset.companies,
            dataset.students,
            dataset.rooms,
            dataset.panels
        );

    refreshValidation();

    res.json({
        success: true,

        message:
            "Dataset and schedule regenerated.",

        scheduled:
            scheduleResult.schedule.length,

        unscheduled:
            scheduleResult.unscheduled.length
    });
});


// ============================================================
// 404
// ============================================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message:
            "API endpoint not found."
    });
});


// ============================================================
// START
// ============================================================

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        "========================================"
    );

    console.log(
        "   PLACEMENT WEEK SCHEDULER API"
    );

    console.log(
        "========================================"
    );

    console.log(
        `Server running on http://localhost:${PORT}`
    );

    console.log(
        `Scheduled interviews: ${
            scheduleResult.schedule.length
        }`
    );

    console.log(
        `Unscheduled interviews: ${
            scheduleResult.unscheduled.length
        }`
    );

    console.log(
        `Schedule valid: ${
            validationResult.valid
        }`
    );
});