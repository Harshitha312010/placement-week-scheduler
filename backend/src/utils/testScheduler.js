const {
    generateDataset
} = require("./dataGenerator");

const {
    scheduleInterviews
} = require("../services/scheduler");

const {
    validateSchedule
} = require("../services/validator");


// Generate complete dataset
const {
    companies,
    students,
    rooms,
    panels,
    metadata
} = generateDataset();


// Generate schedule
const result =
    scheduleInterviews(
        companies,
        students,
        rooms,
        panels
    );

    const validation =
    validateSchedule(
        result.schedule,
        result.unscheduled,
        rooms
    );


// ============================================================
// RESULTS
// ============================================================

console.log(
    "\n========================================"
);

console.log(
    "       PLACEMENT WEEK SCHEDULER"
);

console.log(
    "========================================"
);


console.log(
    "\nDATASET"
);

console.log(
    "Companies:",
    metadata.totalCompanies
);

console.log(
    "Students:",
    metadata.totalStudents
);

console.log(
    "Rooms:",
    metadata.totalRooms
);

console.log(
    "Panels:",
    metadata.totalPanels
);

console.log(
    "Placement days:",
    metadata.totalDays
);


console.log(
    "\nSCHEDULING RESULTS"
);

console.log(
    "Scheduled interviews:",
    result.schedule.length
);

console.log(
    "Unscheduled interviews:",
    result.unscheduled.length
);


// ============================================================
// SAMPLE SCHEDULE
// ============================================================

console.log(
    "\nFIRST 10 SCHEDULED INTERVIEWS"
);

console.table(
    result.schedule
        .slice(0, 10)
        .map(interview => ({
            ID: interview.id,

            Day: interview.day,

            Start: interview.startTime,

            End: interview.endTime,

            Duration:
                interview.duration,

            Status:
                interview.status
        }))
);


// ============================================================
// SAMPLE UNSCHEDULED
// ============================================================

console.log(
    "\nFIRST 10 UNSCHEDULED INTERVIEWS"
);

console.table(
    result.unscheduled
        .slice(0, 10)
        .map(item => ({
            Company:
                item.companyName,

            Student:
                item.studentName,

            Reason:
                item.reason
        }))
);

console.log(
    "\n========================================"
);

console.log(
    "       SCHEDULE VALIDATION"
);

console.log(
    "========================================"
);


console.log(
    "Schedule valid:",
    validation.valid
);

console.log(
    "Total constraint violations:",
    validation.totalConflicts
);


console.log(
    "\nCONFLICT CHECK"
);

console.log(
    "Student conflicts:",
    validation.studentConflicts.length
);

console.log(
    "Room conflicts:",
    validation.roomConflicts.length
);

console.log(
    "Panel conflicts:",
    validation.panelConflicts.length
);

console.log(
    "Duration errors:",
    validation.durationErrors.length
);


console.log(
    "\nMETRICS"
);

console.log(
    "Scheduling percentage:",
    `${validation.metrics.schedulingPercentage}%`
);

console.log(
    "Room utilization:",
    `${validation.metrics.roomUtilization}%`
);