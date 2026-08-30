/*
 * ============================================================
 * PLACEMENT WEEK SCHEDULER
 * ============================================================
 *
 * Responsibilities:
 * - Schedule interviews
 * - Prevent student conflicts
 * - Prevent room conflicts
 * - Prevent panel conflicts
 * - Respect company availability
 * - Prioritize Tier 1 companies
 * - Report interviews that cannot be scheduled
 *
 * Performance:
 * Uses Maps to avoid repeatedly scanning the full schedule.
 */

// ============================================================
// TIME UTILITIES
// ============================================================

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
}


function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}


// ============================================================
// OVERLAP CHECK
// ============================================================

function isOverlapping(
    startA,
    endA,
    startB,
    endB
) {
    return (
        timeToMinutes(startA) < timeToMinutes(endB) &&
        timeToMinutes(startB) < timeToMinutes(endA)
    );
}


// ============================================================
// RESOURCE INDEX
// ============================================================

function createScheduleIndexes() {

    return {
        studentIndex: new Map(),
        roomIndex: new Map(),
        panelIndex: new Map()
    };
}


// ============================================================
// GET RESOURCE BOOKINGS
// ============================================================

function getBookings(index, resourceId, day) {

    const key =
        `${resourceId.toString()}-${day}`;

    return index.get(key) || [];
}


// ============================================================
// CHECK RESOURCE CONFLICT
// ============================================================

function hasConflict(
    index,
    resourceId,
    day,
    startTime,
    endTime
) {

    const bookings =
        getBookings(
            index,
            resourceId,
            day
        );

    return bookings.some(interview =>
        isOverlapping(
            startTime,
            endTime,
            interview.startTime,
            interview.endTime
        )
    );
}


// ============================================================
// STUDENT CONFLICT
// ============================================================

function hasStudentConflict(
    studentId,
    day,
    startTime,
    endTime,
    indexes
) {

    return hasConflict(
        indexes.studentIndex,
        studentId,
        day,
        startTime,
        endTime
    );
}


// ============================================================
// ROOM CONFLICT
// ============================================================

function hasRoomConflict(
    roomId,
    day,
    startTime,
    endTime,
    indexes
) {

    return hasConflict(
        indexes.roomIndex,
        roomId,
        day,
        startTime,
        endTime
    );
}


// ============================================================
// PANEL CONFLICT
// ============================================================

function hasPanelConflict(
    panelId,
    day,
    startTime,
    endTime,
    indexes
) {

    return hasConflict(
        indexes.panelIndex,
        panelId,
        day,
        startTime,
        endTime
    );
}


// ============================================================
// ADD INTERVIEW TO INDEX
// ============================================================

function addToIndex(
    index,
    resourceId,
    day,
    interview
) {

    const key =
        `${resourceId.toString()}-${day}`;

    if (!index.has(key)) {
        index.set(key, []);
    }

    index.get(key).push(interview);
}


// ============================================================
// ADD INTERVIEW TO ALL INDEXES
// ============================================================

function indexInterview(
    interview,
    indexes
) {

    addToIndex(
        indexes.studentIndex,
        interview.studentId,
        interview.day,
        interview
    );

    addToIndex(
        indexes.roomIndex,
        interview.roomId,
        interview.day,
        interview
    );

    addToIndex(
        indexes.panelIndex,
        interview.panelId,
        interview.day,
        interview
    );
}


// ============================================================
// PRIORITY ORDER
// ============================================================

function getPriorityValue(tier) {

    const priority = {
        TIER_1: 1,
        TIER_2: 2,
        TIER_3: 3
    };

    return priority[tier] || 99;
}


// ============================================================
// SCHEDULE INTERVIEWS
// ============================================================

function scheduleInterviews(
    companies,
    students,
    rooms,
    panels
) {

    const schedule = [];
    const unscheduled = [];

    // Fast conflict lookup
    const indexes =
        createScheduleIndexes();


    // --------------------------------------------------------
    // Sort companies by priority
    // --------------------------------------------------------

    const sortedCompanies =
        [...companies].sort(
            (a, b) =>
                getPriorityValue(a.priorityTier) -
                getPriorityValue(b.priorityTier)
        );


    // --------------------------------------------------------
    // Create a student lookup
    // --------------------------------------------------------

    const studentMap = new Map();

    students.forEach(student => {

        studentMap.set(
            student._id.toString(),
            student
        );

    });


    // --------------------------------------------------------
    // Schedule each company
    // --------------------------------------------------------

    for (const company of sortedCompanies) {

        // ----------------------------------------------------
        // Find shortlisted students
        // ----------------------------------------------------

        const companyStudents =
            company.shortlistedStudents
                .map(studentId =>
                    studentMap.get(
                        studentId.toString()
                    )
                )
                .filter(Boolean);


        // ----------------------------------------------------
        // Students with more interviews first
        // ----------------------------------------------------

        companyStudents.sort(
            (a, b) =>
                b.shortlistedCompanies.length -
                a.shortlistedCompanies.length
        );


        // ----------------------------------------------------
        // Get available company panels
        // ----------------------------------------------------

        const companyPanels =
            panels.filter(panel =>
                panel.company.toString() ===
                    company._id.toString() &&
                panel.status === "AVAILABLE"
            );


        // ----------------------------------------------------
        // No panels = everything is unscheduled
        // ----------------------------------------------------

        if (companyPanels.length === 0) {

            companyStudents.forEach(student => {

                unscheduled.push({

                    companyId:
                        company._id,

                    companyName:
                        company.name,

                    studentId:
                        student._id,

                    studentName:
                        student.name,

                    reason:
                        "No available panel exists for this company."
                });

            });

            continue;
        }


        // ----------------------------------------------------
        // Schedule each student
        // ----------------------------------------------------

        for (const student of companyStudents) {

            let scheduled = false;


            // ------------------------------------------------
            // Try company days
            // ------------------------------------------------

            for (
                const day of company.availableDays
            ) {

                if (scheduled) {
                    break;
                }


                // --------------------------------------------
                // Try company time slots
                // --------------------------------------------

                for (
                    const startTime of company.availableSlots
                ) {

                    if (scheduled) {
                        break;
                    }


                    const startMinutes =
                        timeToMinutes(startTime);


                    const endMinutes =
                        startMinutes +
                        company.interviewDuration;


                    const endTime =
                        minutesToTime(endMinutes);


                    // ----------------------------------------
                    // Student conflict can be checked once
                    // per time slot before checking resources.
                    // ----------------------------------------

                    if (
                        hasStudentConflict(
                            student._id,
                            day,
                            startTime,
                            endTime,
                            indexes
                        )
                    ) {

                        continue;
                    }


                    // ----------------------------------------
                    // Try available panels
                    // ----------------------------------------

                    for (
                        const panel of companyPanels
                    ) {

                        if (
                            hasPanelConflict(
                                panel._id,
                                day,
                                startTime,
                                endTime,
                                indexes
                            )
                        ) {

                            continue;
                        }


                        // ------------------------------------
                        // Find an available room
                        // ------------------------------------

                        let selectedRoom = null;


                        for (
                            const room of rooms
                        ) {

                            if (
                                room.status !==
                                "AVAILABLE"
                            ) {

                                continue;
                            }


                            if (
                                !hasRoomConflict(
                                    room._id,
                                    day,
                                    startTime,
                                    endTime,
                                    indexes
                                )
                            ) {

                                selectedRoom = room;

                                break;
                            }
                        }


                        // ------------------------------------
                        // No room available
                        // ------------------------------------

                        if (!selectedRoom) {

                            continue;
                        }


                        // ------------------------------------
                        // Create interview
                        // ------------------------------------

                        const interview = {

                            id:
                                `INT-${schedule.length + 1}`,

                            companyId:
                                company._id,

                            companyName:
                                company.name,

                            studentId:
                                student._id,

                            studentName:
                                student.name,

                            panelId:
                                panel._id,

                            panelName:
                                panel.name,

                            roomId:
                                selectedRoom._id,

                            roomName:
                                selectedRoom.name,

                            day,

                            startTime,

                            endTime,

                            duration:
                                company.interviewDuration,

                            status:
                                "SCHEDULED"
                        };


                        // ------------------------------------
                        // Save schedule
                        // ------------------------------------

                        schedule.push(
                            interview
                        );


                        // ------------------------------------
                        // Update indexes
                        // ------------------------------------

                        indexInterview(
                            interview,
                            indexes
                        );


                        scheduled = true;

                        break;
                    }
                }
            }


            // ------------------------------------------------
            // Could not schedule student
            // ------------------------------------------------

            if (!scheduled) {

                unscheduled.push({

                    companyId:
                        company._id,

                    companyName:
                        company.name,

                    studentId:
                        student._id,

                    studentName:
                        student.name,

                    reason:
                        determineUnscheduledReason(
                            company,
                            student,
                            companyPanels,
                            rooms,
                            indexes
                        )
                });
            }
        }
    }


    return {
        schedule,
        unscheduled
    };
}


// ============================================================
// UNSCHEDULED REASON
// ============================================================

function determineUnscheduledReason(
    company,
    student,
    companyPanels,
    rooms,
    indexes
) {

    if (companyPanels.length === 0) {

        return "No available company panel.";
    }


    /*
     * Check whether the student has any possible
     * availability at all.
     */

    let studentHasPossibleSlot = false;

    for (
        const day of company.availableDays
    ) {

        for (
            const startTime of company.availableSlots
        ) {

            const startMinutes =
                timeToMinutes(startTime);

            const endTime =
                minutesToTime(
                    startMinutes +
                    company.interviewDuration
                );


            if (
                !hasStudentConflict(
                    student._id,
                    day,
                    startTime,
                    endTime,
                    indexes
                )
            ) {

                studentHasPossibleSlot = true;

                break;
            }
        }

        if (studentHasPossibleSlot) {
            break;
        }
    }


    if (!studentHasPossibleSlot) {

        return "Student has no non-conflicting time slot.";
    }


    /*
     * If the student has free time but could not
     * be assigned, resource capacity is likely the issue.
     */

    return "No feasible combination of time, panel and room was available.";
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    scheduleInterviews,

    timeToMinutes,

    minutesToTime,

    isOverlapping,

    hasStudentConflict,

    hasRoomConflict,

    hasPanelConflict
};