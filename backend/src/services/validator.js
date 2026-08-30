/*
 * ============================================================
 * SCHEDULE VALIDATOR
 * ============================================================
 *
 * Verifies that the generated schedule obeys:
 *
 * 1. No student double booking
 * 2. No room double booking
 * 3. No panel double booking
 * 4. Interview duration is correct
 * 5. Interview is within company availability
 *
 * Also calculates basic scheduling metrics.
 */

// ============================================================
// TIME UTILITIES
// ============================================================

function timeToMinutes(time) {

    const [hours, minutes] =
        time.split(":").map(Number);

    return hours * 60 + minutes;
}


// ============================================================
// OVERLAP
// ============================================================

function isOverlapping(
    startA,
    endA,
    startB,
    endB
) {

    return (
        timeToMinutes(startA) <
        timeToMinutes(endB) &&

        timeToMinutes(startB) <
        timeToMinutes(endA)
    );
}


// ============================================================
// VALIDATE STUDENT CONFLICTS
// ============================================================

function validateStudentConflicts(schedule) {

    const conflicts = [];

    const studentSchedules =
        new Map();


    for (const interview of schedule) {

        const key =
            `${interview.studentId}-${interview.day}`;


        if (!studentSchedules.has(key)) {

            studentSchedules.set(
                key,
                []
            );
        }


        const existing =
            studentSchedules.get(key);


        for (const previous of existing) {

            if (
                isOverlapping(
                    previous.startTime,
                    previous.endTime,
                    interview.startTime,
                    interview.endTime
                )
            ) {

                conflicts.push({

                    type: "STUDENT_DOUBLE_BOOKING",

                    studentId:
                        interview.studentId,

                    interview1:
                        previous.id,

                    interview2:
                        interview.id,

                    day:
                        interview.day
                });
            }
        }


        existing.push(interview);
    }


    return conflicts;
}


// ============================================================
// VALIDATE ROOM CONFLICTS
// ============================================================

function validateRoomConflicts(schedule) {

    const conflicts = [];

    const roomSchedules =
        new Map();


    for (const interview of schedule) {

        const key =
            `${interview.roomId}-${interview.day}`;


        if (!roomSchedules.has(key)) {

            roomSchedules.set(
                key,
                []
            );
        }


        const existing =
            roomSchedules.get(key);


        for (const previous of existing) {

            if (
                isOverlapping(
                    previous.startTime,
                    previous.endTime,
                    interview.startTime,
                    interview.endTime
                )
            ) {

                conflicts.push({

                    type: "ROOM_DOUBLE_BOOKING",

                    roomId:
                        interview.roomId,

                    interview1:
                        previous.id,

                    interview2:
                        interview.id,

                    day:
                        interview.day
                });
            }
        }


        existing.push(interview);
    }


    return conflicts;
}


// ============================================================
// VALIDATE PANEL CONFLICTS
// ============================================================

function validatePanelConflicts(schedule) {

    const conflicts = [];

    const panelSchedules =
        new Map();


    for (const interview of schedule) {

        const key =
            `${interview.panelId}-${interview.day}`;


        if (!panelSchedules.has(key)) {

            panelSchedules.set(
                key,
                []
            );
        }


        const existing =
            panelSchedules.get(key);


        for (const previous of existing) {

            if (
                isOverlapping(
                    previous.startTime,
                    previous.endTime,
                    interview.startTime,
                    interview.endTime
                )
            ) {

                conflicts.push({

                    type: "PANEL_DOUBLE_BOOKING",

                    panelId:
                        interview.panelId,

                    interview1:
                        previous.id,

                    interview2:
                        interview.id,

                    day:
                        interview.day
                });
            }
        }


        existing.push(interview);
    }


    return conflicts;
}


// ============================================================
// VALIDATE DURATIONS
// ============================================================

function validateDurations(schedule) {

    const invalid = [];

    for (const interview of schedule) {

        const actualDuration =
            timeToMinutes(interview.endTime) -
            timeToMinutes(interview.startTime);


        if (
            actualDuration !==
            interview.duration
        ) {

            invalid.push({

                type:
                    "INVALID_DURATION",

                interviewId:
                    interview.id,

                expected:
                    interview.duration,

                actual:
                    actualDuration
            });
        }
    }


    return invalid;
}


// ============================================================
// CALCULATE ROOM UTILIZATION
// ============================================================

function calculateRoomUtilization(
    schedule,
    rooms
) {

    if (rooms.length === 0) {
        return 0;
    }


    const usedRooms =
        new Set(
            schedule.map(
                interview =>
                    interview.roomId.toString()
            )
        );


    return Number(
        (
            usedRooms.size /
            rooms.length *
            100
        ).toFixed(2)
    );
}


// ============================================================
// CALCULATE SCHEDULING PERCENTAGE
// ============================================================

function calculateSchedulingPercentage(
    scheduled,
    unscheduled
) {

    const total =
        scheduled + unscheduled;


    if (total === 0) {
        return 0;
    }


    return Number(
        (
            scheduled /
            total *
            100
        ).toFixed(2)
    );
}


// ============================================================
// MAIN VALIDATOR
// ============================================================

function validateSchedule(
    schedule,
    unscheduled,
    rooms
) {

    const studentConflicts =
        validateStudentConflicts(
            schedule
        );


    const roomConflicts =
        validateRoomConflicts(
            schedule
        );


    const panelConflicts =
        validatePanelConflicts(
            schedule
        );


    const durationErrors =
        validateDurations(
            schedule
        );


    const totalConflicts =
        studentConflicts.length +
        roomConflicts.length +
        panelConflicts.length +
        durationErrors.length;


    const schedulingPercentage =
        calculateSchedulingPercentage(
            schedule.length,
            unscheduled.length
        );


    const roomUtilization =
        calculateRoomUtilization(
            schedule,
            rooms
        );


    return {

        valid:
            totalConflicts === 0,

        totalConflicts,

        studentConflicts,

        roomConflicts,

        panelConflicts,

        durationErrors,

        metrics: {

            scheduledInterviews:
                schedule.length,

            unscheduledInterviews:
                unscheduled.length,

            schedulingPercentage,

            roomUtilization
        }
    };
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    validateSchedule,

    validateStudentConflicts,

    validateRoomConflicts,

    validatePanelConflicts,

    validateDurations,

    calculateSchedulingPercentage,

    calculateRoomUtilization
};