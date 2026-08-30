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
// INITIAL SCHEDULE
// ============================================================

const initialResult =
    scheduleInterviews(
        dataset.companies,
        dataset.students,
        dataset.rooms,
        dataset.panels
    );


// ============================================================
// PICK ONE REAL SCHEDULED INTERVIEW
// ============================================================

const targetInterview =
    initialResult.schedule[0];


if (!targetInterview) {

    console.log(
        "No scheduled interview available for replan test."
    );

    process.exit(1);
}


// ============================================================
// TEST STUDENT WITHDRAWAL
// ============================================================

const disruption = {

    type: "STUDENT_WITHDRAWAL",

    studentId:
        targetInterview.studentId,

    description:
        `${targetInterview.studentName} withdrew from placement.`
};


const result =
    replanSchedule(
        initialResult.schedule,
        dataset.companies,
        dataset.rooms,
        dataset.panels,
        disruption
    );


// ============================================================
// OUTPUT
// ============================================================

console.log(
    "\n========================================"
);

console.log(
    "        REPLAN TEST"
);

console.log(
    "========================================"
);


console.log(
    "\nDisruption:"
);

console.log(
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

console.table(
    result.changes.map(change => ({
        Interview:
            change.interviewId,

        Student:
            change.studentName,

        Company:
            change.companyName,

        Reason:
            change.reason,

        Changes:
            change.changes
                .map(item =>
                    `${item.field}: ${item.from} → ${item.to}`
                )
                .join(" | ")
    }))
);


console.log(
    "\nUNSCHEDULED AFTER REPLAN"
);

console.table(
    result.unscheduled
);