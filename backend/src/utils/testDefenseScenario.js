const { generateDataset } = require("./dataGenerator");
const { scheduleInterviews } = require("../services/scheduler");
const { replanSchedule } = require("../services/replanner");
const { validateSchedule } = require("../services/validator");

console.log("\n========================================");
console.log("       LIVE DEFENSE SCENARIO TEST");
console.log("========================================\n");

// ============================================================
// 1. GENERATE DATASET
// ============================================================

const dataset = generateDataset();

// ============================================================
// 2. GENERATE INITIAL SCHEDULE
// ============================================================

const initialResult = scheduleInterviews(
    dataset.companies,
    dataset.students,
    dataset.rooms,
    dataset.panels
);

const initialSchedule = initialResult.schedule;

// ============================================================
// 3. FIND THE BIGGEST DAY-1 RECRUITER
// ============================================================

const day1Companies = dataset.companies.filter(company =>
    company.availableDays.includes(1)
);

const companyInterviewCounts = new Map();

for (const interview of initialSchedule) {
    if (interview.day !== 1) {
        continue;
    }

    const companyId = interview.companyId.toString();

    companyInterviewCounts.set(
        companyId,
        (companyInterviewCounts.get(companyId) || 0) + 1
    );
}

const biggestRecruiter = [...day1Companies]
    .sort((a, b) => {
        const countA =
            companyInterviewCounts.get(a._id.toString()) || 0;

        const countB =
            companyInterviewCounts.get(b._id.toString()) || 0;

        return countB - countA;
    })[0];

if (!biggestRecruiter) {
    console.error(
        "Could not find a Day-1 recruiter."
    );
    process.exit(1);
}

// ============================================================
// 4. FIND A DAY-1 PANEL FOR THAT COMPANY
// ============================================================

const recruiterInterviews = initialSchedule.filter(
    interview =>
        interview.day === 1 &&
        interview.companyId.toString() ===
            biggestRecruiter._id.toString()
);

if (recruiterInterviews.length === 0) {
    console.error(
        "Biggest Day-1 recruiter has no scheduled interviews."
    );
    process.exit(1);
}

const panelId =
    recruiterInterviews[0].panelId;

// ============================================================
// 5. SELECT 15 REAL STUDENTS FROM THAT RECRUITER
// ============================================================

const studentsForRecruiter = [
    ...new Map(
        recruiterInterviews
            .map(interview => [
                interview.studentId.toString(),
                interview
            ])
    ).values()
];

const withdrawingStudents =
    studentsForRecruiter.slice(0, 15);

if (withdrawingStudents.length < 15) {
    console.log(
        `Only ${withdrawingStudents.length} scheduled students were available for withdrawal.`
    );
}

// ============================================================
// 6. APPLY THE DISRUPTION
// ============================================================

let workingSchedule = initialSchedule;

// ------------------------------------------------------------
// A. COMPANY 3-HOUR DELAY
// ------------------------------------------------------------

const companyDelayResult = replanSchedule(
    workingSchedule,
    dataset.companies,
    dataset.rooms,
    dataset.panels,
    {
        type: "COMPANY_DELAY",
        companyId: biggestRecruiter._id,
        delayHours: 3
    }
);

workingSchedule =
    companyDelayResult.schedule;

// ------------------------------------------------------------
// B. PANEL DROP
// ------------------------------------------------------------

const panelDropResult = replanSchedule(
    workingSchedule,
    dataset.companies,
    dataset.rooms,
    dataset.panels,
    {
        type: "PANEL_DROP",
        panelId
    }
);

workingSchedule =
    panelDropResult.schedule;

// ------------------------------------------------------------
// C. 15 STUDENT WITHDRAWALS
// ------------------------------------------------------------

const withdrawalResults = [];

for (const interview of withdrawingStudents) {

    const result = replanSchedule(
        workingSchedule,
        dataset.companies,
        dataset.rooms,
        dataset.panels,
        {
            type: "STUDENT_WITHDRAWAL",
            studentId: interview.studentId
        }
    );

    workingSchedule = result.schedule;

    withdrawalResults.push(result);
}

// ============================================================
// 7. COMBINED SUMMARY
// ============================================================

const totalMoved =
    companyDelayResult.summary.moved +
    panelDropResult.summary.moved;

const totalCancelled =
    companyDelayResult.summary.cancelled +
    panelDropResult.summary.cancelled +
    withdrawalResults.reduce(
        (sum, result) =>
            sum + result.summary.cancelled,
        0
    );

const totalUnscheduled =
    companyDelayResult.summary.unscheduled +
    panelDropResult.summary.unscheduled +
    withdrawalResults.reduce(
        (sum, result) =>
            sum + result.summary.unscheduled,
        0
    );

// ============================================================
// 8. VALIDATE FINAL SCHEDULE
// ============================================================

const finalValidation =
    validateSchedule(
        workingSchedule,
        [],
        dataset.rooms
    );

// ============================================================
// 9. OUTPUT
// ============================================================

console.log(
    "\n----------------------------------------"
);

console.log(
    "DEFENSE SCENARIO"
);

console.log(
    "----------------------------------------"
);

console.log({
    biggestDay1Recruiter:
        biggestRecruiter.name,

    companyDelay:
        "3 hours",

    panelDropped:
        recruiterInterviews[0].panelName,

    studentsWithdrawn:
        withdrawingStudents.length
});

console.log(
    "\n----------------------------------------"
);

console.log(
    "COMPANY DELAY RESULT"
);

console.log(
    "----------------------------------------"
);

console.log(
    companyDelayResult.summary
);

console.log(
    "\n----------------------------------------"
);

console.log(
    "PANEL DROP RESULT"
);

console.log(
    "----------------------------------------"
);

console.log(
    panelDropResult.summary
);

console.log(
    "\n----------------------------------------"
);

console.log(
    "STUDENT WITHDRAWAL RESULTS"
);

console.log(
    "----------------------------------------"
);

console.log({
    studentsProcessed:
        withdrawalResults.length,

    interviewsCancelled:
        withdrawalResults.reduce(
            (sum, result) =>
                sum + result.summary.cancelled,
            0
        )
});

console.log(
    "\n----------------------------------------"
);

console.log(
    "COMBINED RESULT"
);

console.log(
    "----------------------------------------"
);

console.log({
    totalMoved,
    totalCancelled,
    totalUnscheduled,

    finalScheduled:
        workingSchedule.filter(
            interview =>
                interview.status !== "UNSCHEDULED" &&
                interview.status !== "CANCELLED"
        ).length
});

console.log(
    "\n----------------------------------------"
);

console.log(
    "FINAL VALIDATION"
);

console.log(
    "----------------------------------------"
);

console.log({
    valid:
        finalValidation.valid,

    studentConflicts:
        finalValidation.studentConflicts.length,

    roomConflicts:
        finalValidation.roomConflicts.length,

    panelConflicts:
        finalValidation.panelConflicts.length,

    durationErrors:
        finalValidation.durationErrors.length
});

console.log(
    "\n========================================"
);

if (finalValidation.valid) {
    console.log(
        "DEFENSE SCENARIO VALIDATION: PASS ✅"
    );
} else {
    console.log(
        "DEFENSE SCENARIO VALIDATION: FAIL ❌"
    );
}

console.log(
    "========================================\n"
);