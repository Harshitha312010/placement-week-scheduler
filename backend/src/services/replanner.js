/*
 * ============================================================
 * PLACEMENT WEEK REPLANNER
 * ============================================================
 *
 * Required disruptions:
 * - Company delay
 * - Panel drop
 * - Student withdrawal
 * - Room unavailable
 *
 * Replanning policy:
 * - Keep unaffected interviews unchanged.
 * - Replan only affected interviews.
 * - Prefer the closest possible replacement.
 * - Never violate student/room/panel constraints.
 * - Always produce a change diff.
 */

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function isOverlapping(startA, endA, startB, endB) {
    return (
        timeToMinutes(startA) < timeToMinutes(endB) &&
        timeToMinutes(startB) < timeToMinutes(endA)
    );
}

function sameId(a, b) {
    return (
        a !== null &&
        a !== undefined &&
        b !== null &&
        b !== undefined &&
        a.toString() === b.toString()
    );
}

/*
 * Check whether a particular resource is already booked.
 */
function hasResourceConflict(
    schedule,
    field,
    resourceId,
    day,
    startTime,
    endTime
) {
    return schedule.some((interview) => {
        if (!sameId(interview[field], resourceId)) {
            return false;
        }

        if (interview.day !== day) {
            return false;
        }

        return isOverlapping(
            startTime,
            endTime,
            interview.startTime,
            interview.endTime
        );
    });
}

/*
 * Save the original appointment so the diff can
 * compare before and after.
 */
function snapshotInterview(interview) {
    return {
        day: interview.day,
        startTime: interview.startTime,
        endTime: interview.endTime,
        roomId: interview.roomId,
        roomName: interview.roomName,
        panelId: interview.panelId,
        panelName: interview.panelName,
        status: interview.status
    };
}

/*
 * Build exact field-level differences.
 */
function buildChangeList(before, after) {
    const changes = [];

    if (
        before.day !== after.day ||
        before.startTime !== after.startTime ||
        before.endTime !== after.endTime
    ) {
        changes.push({
            field: "TIME",
            from:
                `Day ${before.day} ${before.startTime}-${before.endTime}`,
            to:
                `Day ${after.day} ${after.startTime}-${after.endTime}`
        });
    }

    if (!sameId(before.roomId, after.roomId)) {
        changes.push({
            field: "ROOM",
            from: before.roomName || "—",
            to: after.roomName || "—"
        });
    }

    if (!sameId(before.panelId, after.panelId)) {
        changes.push({
            field: "PANEL",
            from: before.panelName || "—",
            to: after.panelName || "—"
        });
    }

    if (before.status !== after.status) {
        changes.push({
            field: "STATUS",
            from: before.status,
            to: after.status
        });
    }

    return changes;
}

/*
 * People who should be informed.
 */
function buildNotifications(interview, disruptionType) {
    const notifications = [
        "Placement Coordinator"
    ];

    if (interview.studentName) {
        notifications.push(
            `Student: ${interview.studentName}`
        );
    }

    if (interview.companyName) {
        notifications.push(
            `Company: ${interview.companyName}`
        );
    }

    if (disruptionType === "PANEL_DROP") {
        notifications.push(
            "Company Panel Coordinator"
        );
    }

    if (disruptionType === "ROOM_UNAVAILABLE") {
        notifications.push(
            "Room Coordinator"
        );
    }

    return [...new Set(notifications)];
}

/*
 * Human-readable reason.
 */
function getReason(type) {
    switch (type) {
        case "COMPANY_DELAY":
            return "Company arrived late.";

        case "PANEL_DROP":
            return "Interview panel became unavailable.";

        case "ROOM_UNAVAILABLE":
            return "Interview room became unavailable.";

        case "STUDENT_WITHDRAWAL":
            return "Student withdrew from placement.";

        default:
            return "Schedule disruption.";
    }
}

/*
 * Failure explanation.
 */
function getFailureReason(type) {
    switch (type) {
        case "COMPANY_DELAY":
            return "No feasible replacement remained after the company delay.";

        case "PANEL_DROP":
            return "No feasible replacement remained after the panel became unavailable.";

        case "ROOM_UNAVAILABLE":
            return "No feasible replacement remained after the room became unavailable.";

        default:
            return "No feasible replacement was available.";
    }
}

/*
 * ============================================================
 * GENERATE CANDIDATE TIME SLOTS
 * ============================================================
 *
 * Original slot and nearby times are attempted first.
 * Then we expand to the full working day.
 *
 * 09:00 - 13:00
 * 14:00 - 17:30
 */
function generateCandidateSlots(
    originalStart,
    duration,
    disruption
) {
    const WORKING_WINDOWS = [
        {
            start: 9 * 60,
            end: 13 * 60
        },
        {
            start: 14 * 60,
            end: 17 * 60 + 30
        }
    ];

    const originalMinutes =
        timeToMinutes(originalStart);

    let earliestAllowed = 0;

    if (
        disruption.type ===
        "COMPANY_DELAY"
    ) {
        earliestAllowed =
            originalMinutes +
            (disruption.delayHours || 0) * 60;
    }

    const candidates = [];

    /*
     * Generate every 15-minute start position that
     * can fit the complete interview.
     */
    for (const window of WORKING_WINDOWS) {

        for (
            let start = window.start;
            start + duration <= window.end;
            start += 15
        ) {
            if (start < earliestAllowed) {
                continue;
            }

            candidates.push(start);
        }
    }

    /*
     * Sort closest to original time first.
     *
     * For company delay, earlier-than-allowed slots
     * were already filtered out.
     */
    candidates.sort(
        (a, b) =>
            Math.abs(a - originalMinutes) -
            Math.abs(b - originalMinutes)
    );

    /*
     * Remove duplicate start times.
     */
    return [
        ...new Set(
            candidates.map(
                minute => minutesToTime(minute)
            )
        )
    ];
}

/*
 * ============================================================
 * FIND COMPANY
 * ============================================================
 */
function findCompany(companies, companyId) {
    return companies.find(company =>
        sameId(company._id, companyId)
    );
}

/*
 * ============================================================
 * FIND REPLACEMENT
 * ============================================================
 */
function findReplacement({
    interview,
    company,
    rooms,
    panels,
    schedule,
    disruption
}) {
    const candidateDays = [
        interview.day,
        ...company.availableDays.filter(
            day => day !== interview.day
        )
    ];

    const candidateSlots =
        generateCandidateSlots(
            interview.startTime,
            interview.duration,
            disruption
        );

    /*
     * Valid panels belonging to the company.
     */
    const validPanels =
        panels.filter(panel => {

            if (panel.status !== "AVAILABLE") {
                return false;
            }

            if (
                !sameId(
                    panel.company,
                    company._id
                )
            ) {
                return false;
            }

            if (
                disruption.type === "PANEL_DROP" &&
                sameId(
                    panel._id,
                    disruption.panelId
                )
            ) {
                return false;
            }

            return true;
        });

    /*
     * Try nearest possible appointment first.
     */
    for (const day of candidateDays) {

        for (const startTime of candidateSlots) {

            const endTime =
                minutesToTime(
                    timeToMinutes(startTime) +
                    interview.duration
                );

            /*
             * Student must be free.
             */
            if (
                hasResourceConflict(
                    schedule,
                    "studentId",
                    interview.studentId,
                    day,
                    startTime,
                    endTime
                )
            ) {
                continue;
            }

            for (const panel of validPanels) {

                /*
                 * Panel must be free.
                 */
                if (
                    hasResourceConflict(
                        schedule,
                        "panelId",
                        panel._id,
                        day,
                        startTime,
                        endTime
                    )
                ) {
                    continue;
                }

                /*
                 * Find first valid room.
                 */
                for (const room of rooms) {

                    if (
                        room.status !==
                        "AVAILABLE"
                    ) {
                        continue;
                    }

                    if (
                        disruption.type ===
                        "ROOM_UNAVAILABLE" &&
                        sameId(
                            room._id,
                            disruption.roomId
                        )
                    ) {
                        continue;
                    }

                    if (
                        hasResourceConflict(
                            schedule,
                            "roomId",
                            room._id,
                            day,
                            startTime,
                            endTime
                        )
                    ) {
                        continue;
                    }

                    return {
                        day,
                        startTime,
                        endTime,
                        panel,
                        room
                    };
                }
            }
        }
    }

    return null;
}

/*
 * ============================================================
 * MAIN REPLAN FUNCTION
 * ============================================================
 */
function replanSchedule(
    schedule,
    companies,
    rooms,
    panels,
    disruption
) {
    const updatedSchedule =
        schedule.map(interview => ({
            ...interview
        }));

    const changes = [];
    const unscheduled = [];
    const affectedInterviewIds = new Set();

    /*
     * Identify affected appointments.
     */
    const affectedInterviews =
        updatedSchedule.filter(interview => {

            switch (disruption.type) {

                case "STUDENT_WITHDRAWAL":
                    return sameId(
                        interview.studentId,
                        disruption.studentId
                    );

                case "PANEL_DROP":
                    return sameId(
                        interview.panelId,
                        disruption.panelId
                    );

                case "ROOM_UNAVAILABLE":
                    return sameId(
                        interview.roomId,
                        disruption.roomId
                    );

                case "COMPANY_DELAY":
                    return sameId(
                        interview.companyId,
                        disruption.companyId
                    );

                default:
                    return false;
            }
        });

    /*
     * ========================================================
     * STUDENT WITHDRAWAL
     * ========================================================
     */
    if (
        disruption.type ===
        "STUDENT_WITHDRAWAL"
    ) {

        for (const interview of affectedInterviews) {

            const before =
                snapshotInterview(interview);

            interview.status =
                "CANCELLED";

            const change = {
                interviewId:
                    interview.id,

                studentId:
                    interview.studentId,

                studentName:
                    interview.studentName,

                companyId:
                    interview.companyId,

                companyName:
                    interview.companyName,

                reason:
                    getReason(
                        disruption.type
                    ),

                changes:
                    buildChangeList(
                        before,
                        interview
                    ),

                notifications:
                    buildNotifications(
                        interview,
                        disruption.type
                    )
            };

            changes.push(change);

            affectedInterviewIds.add(
                interview.id
            );
        }

        return buildResult({
            updatedSchedule,
            changes,
            unscheduled,
            affectedInterviewIds,
            disruption
        });
    }

    /*
     * ========================================================
     * MARK DISRUPTED RESOURCE UNAVAILABLE
     * ========================================================
     */
    if (
        disruption.type ===
        "ROOM_UNAVAILABLE"
    ) {
        const room =
            rooms.find(room =>
                sameId(
                    room._id,
                    disruption.roomId
                )
            );

        if (room) {
            room.status =
                "UNAVAILABLE";
        }
    }

    if (
        disruption.type ===
        "PANEL_DROP"
    ) {
        const panel =
            panels.find(panel =>
                sameId(
                    panel._id,
                    disruption.panelId
                )
            );

        if (panel) {
            panel.status =
                "DROPPED";
        }
    }

    /*
     * ========================================================
     * REPLAN AFFECTED INTERVIEWS
     * ========================================================
     */
    for (
        const originalInterview of
        affectedInterviews
    ) {

        const scheduleIndex =
            updatedSchedule.findIndex(
                interview =>
                    interview.id ===
                    originalInterview.id
            );

        if (scheduleIndex === -1) {
            continue;
        }

        const interview =
            updatedSchedule[
                scheduleIndex
            ];

        const company =
            findCompany(
                companies,
                interview.companyId
            );

        if (!company) {

            unscheduled.push({
                interviewId:
                    interview.id,

                studentName:
                    interview.studentName,

                companyName:
                    interview.companyName,

                reason:
                    "Company information unavailable."
            });

            continue;
        }

        const before =
            snapshotInterview(interview);

        /*
         * Remove this appointment while searching.
         * That prevents it from blocking its own
         * replacement.
         */
        updatedSchedule.splice(
            scheduleIndex,
            1
        );

        const replacement =
            findReplacement({
                interview,
                company,
                rooms,
                panels,
                schedule:
                    updatedSchedule,
                disruption
            });

        if (!replacement) {

            interview.status =
                "UNSCHEDULED";

            updatedSchedule.push(
                interview
            );

            unscheduled.push({
                interviewId:
                    interview.id,

                studentName:
                    interview.studentName,

                companyName:
                    interview.companyName,

                reason:
                    getFailureReason(
                        disruption.type
                    )
            });

            affectedInterviewIds.add(
                interview.id
            );

            continue;
        }

        /*
         * Apply new assignment.
         */
        interview.day =
            replacement.day;

        interview.startTime =
            replacement.startTime;

        interview.endTime =
            replacement.endTime;

        interview.panelId =
            replacement.panel._id;

        interview.panelName =
            replacement.panel.name;

        interview.roomId =
            replacement.room._id;

        interview.roomName =
            replacement.room.name;

        interview.status =
            "MOVED";

        updatedSchedule.push(
            interview
        );

        const change = {
            interviewId:
                interview.id,

            studentId:
                interview.studentId,

            studentName:
                interview.studentName,

            companyId:
                interview.companyId,

            companyName:
                interview.companyName,

            reason:
                getReason(
                    disruption.type
                ),

            changes:
                buildChangeList(
                    before,
                    interview
                ),

            notifications:
                buildNotifications(
                    interview,
                    disruption.type
                )
        };

        changes.push(change);

        affectedInterviewIds.add(
            interview.id
        );
    }

    return buildResult({
        updatedSchedule,
        changes,
        unscheduled,
        affectedInterviewIds,
        disruption
    });
}

/*
 * ============================================================
 * RESULT
 * ============================================================
 */
function buildResult({
    updatedSchedule,
    changes,
    unscheduled,
    affectedInterviewIds,
    disruption
}) {
    let moved = 0;
    let cancelled = 0;

    for (const change of changes) {

        const hasMovement =
            change.changes.some(
                item =>
                    item.field === "TIME" ||
                    item.field === "ROOM" ||
                    item.field === "PANEL"
            );

        if (hasMovement) {
            moved++;
        }

        const statusChange =
            change.changes.find(
                item =>
                    item.field === "STATUS"
            );

        if (
            statusChange &&
            statusChange.to === "CANCELLED"
        ) {
            cancelled++;
        }
    }

    return {
        success: true,

        disruption,

        schedule:
            updatedSchedule,

        summary: {
            affectedInterviews:
                affectedInterviewIds.size,

            moved,

            cancelled,

            unscheduled:
                unscheduled.length,

            unchanged:
                updatedSchedule.filter(
                    interview =>
                        !affectedInterviewIds.has(
                            interview.id
                        )
                ).length
        },

        changes,

        unscheduled,

        affectedInterviewIds:
            [...affectedInterviewIds]
    };
}

module.exports = {
    replanSchedule,
    timeToMinutes,
    minutesToTime,
    isOverlapping
};