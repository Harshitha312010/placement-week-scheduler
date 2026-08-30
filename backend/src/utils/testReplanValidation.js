const { generateDataset } = require("./dataGenerator");
const { scheduleInterviews } = require("../services/scheduler");
const { validateSchedule } = require("../services/validator");
const { replanSchedule } = require("../services/replanner");

const dataset = generateDataset();

const initial = scheduleInterviews(
    dataset.companies,
    dataset.students,
    dataset.rooms,
    dataset.panels
);

function validate(label, result) {
    const validation = validateSchedule(
        result.schedule,
        result.unscheduled,
        dataset.rooms
    );

    console.log("\n========================================");
    console.log(label);
    console.log("========================================");

    console.log({
        affected: result.summary.affectedInterviews,
        moved: result.summary.moved,
        cancelled: result.summary.cancelled,
        unscheduled: result.summary.unscheduled,
        unchanged: result.summary.unchanged
    });

    console.log("\nVALIDATION");

    console.log({
        valid: validation.valid,
        studentConflicts:
            validation.studentConflicts.length,
        roomConflicts:
            validation.roomConflicts.length,
        panelConflicts:
            validation.panelConflicts.length,
        durationErrors:
            validation.durationErrors.length
    });
}

const target = initial.schedule[0];

validate(
    "STUDENT WITHDRAWAL",
    replanSchedule(
        initial.schedule,
        dataset.companies,
        dataset.rooms,
        dataset.panels,
        {
            type: "STUDENT_WITHDRAWAL",
            studentId: target.studentId
        }
    )
);

validate(
    "PANEL DROP",
    replanSchedule(
        initial.schedule,
        dataset.companies,
        dataset.rooms,
        dataset.panels,
        {
            type: "PANEL_DROP",
            panelId: target.panelId
        }
    )
);

validate(
    "ROOM UNAVAILABLE",
    replanSchedule(
        initial.schedule,
        dataset.companies,
        dataset.rooms,
        dataset.panels,
        {
            type: "ROOM_UNAVAILABLE",
            roomId: target.roomId
        }
    )
);

validate(
    "COMPANY DELAY",
    replanSchedule(
        initial.schedule,
        dataset.companies,
        dataset.rooms,
        dataset.panels,
        {
            type: "COMPANY_DELAY",
            companyId: target.companyId,
            delayHours: 2
        }
    )
);