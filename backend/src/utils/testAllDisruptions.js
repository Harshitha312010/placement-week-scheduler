const {
    generateDataset
} = require("./dataGenerator");

const {
    scheduleInterviews
} = require("../services/scheduler");

const {
    replanSchedule
} = require("../services/replanner");


// ============================================================
// GENERATE DATA
// ============================================================

const dataset =
    generateDataset();


// ============================================================
// CREATE INITIAL SCHEDULE
// ============================================================

const initialResult =
    scheduleInterviews(
        dataset.companies,
        dataset.students,
        dataset.rooms,
        dataset.panels
    );


if (
    initialResult.schedule.length === 0
) {
    console.error(
        "No scheduled interviews were generated."
    );

    process.exit(1);
}


// ============================================================
// FIND DIFFERENT REAL INTERVIEWS
// ============================================================

const studentTarget =
    initialResult.schedule[0];

const panelTarget =
    initialResult.schedule.find(
        interview =>
            interview.panelId
    );

const roomTarget =
    initialResult.schedule.find(
        interview =>
            interview.roomId
    );

const companyTarget =
    initialResult.schedule.find(
        interview =>
            interview.companyId
    );


// ============================================================
// TEST HELPER
// ============================================================

function testDisruption(
    title,
    disruption
) {
    console.log(
        "\n========================================"
    );

    console.log(
        title
    );

    console.log(
        "========================================"
    );

    const result =
        replanSchedule(
            initialResult.schedule,
            dataset.companies,
            dataset.rooms,
            dataset.panels,
            disruption
        );

    console.log(
        "\nSUMMARY"
    );

    console.log(
        result.summary
    );

    console.log(
        "\nCHANGES"
    );

    if (
        result.changes.length === 0
    ) {
        console.log(
            "No changes recorded."
        );
    } else {

        console.table(
            result.changes.map(change => ({
                Interview:
                    change.interviewId,

                Student:
                    change.studentName,

                Company:
                    change.companyName,

                Changes:
                    change.changes
                        .map(item =>
                            `${item.field}: ${item.from} -> ${item.to}`
                        )
                        .join(" | "),

                Notify:
                    (change.notifications || [])
                        .join(", ")
            }))
        );
    }

    console.log(
        "\nUNSCHEDULED"
    );

    console.table(
        result.unscheduled
    );

    return result;
}


// ============================================================
// 1. STUDENT WITHDRAWAL
// ============================================================

testDisruption(
    "1. STUDENT WITHDRAWAL",
    {
        type:
            "STUDENT_WITHDRAWAL",

        studentId:
            studentTarget.studentId
    }
);


// ============================================================
// 2. PANEL DROP
// ============================================================

testDisruption(
    "2. PANEL DROP",
    {
        type:
            "PANEL_DROP",

        panelId:
            panelTarget.panelId
    }
);


// ============================================================
// 3. ROOM UNAVAILABLE
// ============================================================

testDisruption(
    "3. ROOM UNAVAILABLE",
    {
        type:
            "ROOM_UNAVAILABLE",

        roomId:
            roomTarget.roomId
    }
);


// ============================================================
// 4. COMPANY DELAY
// ============================================================

testDisruption(
    "4. COMPANY DELAY",
    {
        type:
            "COMPANY_DELAY",

        companyId:
            companyTarget.companyId,

        delayHours:
            2
    }
);