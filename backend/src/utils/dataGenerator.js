const mongoose = require("mongoose");

/*
 * ============================================================
 * PLACEMENT WEEK DATA GENERATOR
 * ============================================================
 *
 * Generates:
 * - 35 companies
 * - 800 students
 * - 20 rooms
 * - Company panels
 * - Company availability
 * - Realistic student shortlists
 *
 * Placement week:
 * - 4 days
 * - Tier 1 companies mainly on Day 1
 * - Higher CGPA students are more likely to appear
 *   on multiple company shortlists
 */

// ============================================================
// CONSTANTS
// ============================================================

const TOTAL_COMPANIES = 35;
const TOTAL_STUDENTS = 800;
const TOTAL_ROOMS = 20;
const TOTAL_DAYS = 4;

const BRANCHES = [
    "CSE",
    "ISE",
    "ECE",
    "EEE",
    "ME",
    "CIVIL"
];

const COMPANY_NAMES = [
    "TechNova",
    "InnoSoft",
    "CloudCore",
    "DataSphere",
    "FinEdge",
    "CodeCraft",
    "ByteWorks",
    "NextGen Systems",
    "InfoMatrix",
    "AlphaTech",
    "GlobalLogic",
    "Cognify",
    "DevBridge",
    "PixelSoft",
    "Quantix",
    "WebWorks",
    "CoreStack",
    "SmartByte",
    "NexaTech",
    "VisionSoft",
    "AppForge",
    "LogicLabs",
    "CloudVista",
    "DataWorks",
    "FinTech Solutions",
    "CodeSphere",
    "InnovaTech",
    "TechBridge",
    "DigitalCore",
    "SoftEdge",
    "PrimeSystems",
    "FutureStack",
    "MegaSoft",
    "RapidTech",
    "EnterpriseHub"
];

const ALL_TIME_SLOTS = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30"
];


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function randomInteger(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}


function randomItem(array) {
    return array[
        Math.floor(Math.random() * array.length)
    ];
}


function shuffle(array) {
    return [...array].sort(
        () => Math.random() - 0.5
    );
}


// ============================================================
// COMPANY GENERATOR
// ============================================================

function generateCompanies() {

    const companies = [];

    for (let i = 0; i < TOTAL_COMPANIES; i++) {

        let priorityTier;
        let cgpaCutoff;
        let interviewDuration;
        let panelCount;

        /*
         * First 5 companies:
         * Tier 1 / Day 1 / high priority
         */
        if (i < 5) {

            priorityTier = "TIER_1";

            cgpaCutoff = Number(
                (8.0 + Math.random() * 1.0).toFixed(2)
            );

            interviewDuration = 45;

            panelCount = randomInteger(3, 5);

        }

        /*
         * Next 10 companies:
         * Tier 2
         */
        else if (i < 15) {

            priorityTier = "TIER_2";

            cgpaCutoff = Number(
                (7.0 + Math.random() * 1.0).toFixed(2)
            );

            interviewDuration = randomItem([
                30,
                45
            ]);

            panelCount = randomInteger(2, 4);

        }

        /*
         * Remaining 20 companies:
         * Tier 3
         */
        else {

            priorityTier = "TIER_3";

            cgpaCutoff = Number(
                (6.0 + Math.random() * 1.0).toFixed(2)
            );

            interviewDuration = 30;

            panelCount = randomInteger(1, 2);
        }


        companies.push({

            _id: new mongoose.Types.ObjectId(),

            name: COMPANY_NAMES[i],

            priorityTier,

            cgpaCutoff,

            interviewDuration,

            panelCount,

            shortlistedStudents: [],

            availableDays:
                generateAvailableDays(priorityTier),

            availableSlots:
                generateTimeSlots(priorityTier)
        });
    }

    return companies;
}


// ============================================================
// COMPANY AVAILABLE DAYS
// ============================================================

function generateAvailableDays(priorityTier) {

    if (priorityTier === "TIER_1") {

        // Mass recruiters primarily operate on Day 1
        return [1];
    }

    if (priorityTier === "TIER_2") {

        return [1, 2, 3];
    }

    // Tier 3
    return [2, 3, 4];
}


// ============================================================
// COMPANY AVAILABLE TIME SLOTS
// ============================================================

function generateTimeSlots(priorityTier) {

    let numberOfSlots;

    if (priorityTier === "TIER_1") {

        numberOfSlots = 10;

    } else if (priorityTier === "TIER_2") {

        numberOfSlots = 8;

    } else {

        numberOfSlots = 6;
    }

    return shuffle(ALL_TIME_SLOTS)
        .slice(0, numberOfSlots)
        .sort();
}


// ============================================================
// STUDENT GENERATOR
// ============================================================

function generateStudents() {

    const students = [];

    for (let i = 1; i <= TOTAL_STUDENTS; i++) {

        /*
         * CGPA range:
         * 6.00 - 9.90
         */
        const cgpa = Number(
            (6.0 + Math.random() * 3.9).toFixed(2)
        );

        students.push({

            _id: new mongoose.Types.ObjectId(),

            name: `Student ${i}`,

            rollNumber:
                `STU${String(i).padStart(4, "0")}`,

            cgpa,

            branch: randomItem(BRANCHES),

            shortlistedCompanies: [],

            status: "ACTIVE"
        });
    }

    return students;
}


// ============================================================
// ROOM GENERATOR
// ============================================================

function generateRooms() {

    const rooms = [];

    for (let i = 1; i <= TOTAL_ROOMS; i++) {

        rooms.push({

            _id: new mongoose.Types.ObjectId(),

            name:
                `Room ${String(i).padStart(2, "0")}`,

            capacity: 1,

            status: "AVAILABLE"
        });
    }

    return rooms;
}


// ============================================================
// PANEL GENERATOR
// ============================================================

function generatePanels(companies) {

    const panels = [];

    companies.forEach(company => {

        for (
            let i = 1;
            i <= company.panelCount;
            i++
        ) {

            panels.push({

                _id: new mongoose.Types.ObjectId(),

                company: company._id,

                name:
                    `${company.name} Panel ${i}`,

                status: "AVAILABLE"
            });
        }
    });

    return panels;
}


// ============================================================
// INITIAL SHORTLIST GENERATION
// ============================================================

function generateShortlists(companies, students) {

    companies.forEach(company => {

        let targetShortlistSize;

        /*
         * Tier 1:
         * Mass recruiters.
         */
        if (company.priorityTier === "TIER_1") {

            targetShortlistSize =
                randomInteger(250, 450);

        }

        /*
         * Tier 2:
         */
        else if (company.priorityTier === "TIER_2") {

            targetShortlistSize =
                randomInteger(80, 200);

        }

        /*
         * Tier 3:
         */
        else {

            targetShortlistSize =
                randomInteger(30, 100);
        }


        /*
         * Only students meeting the CGPA cutoff
         * can be shortlisted.
         */
        const eligibleStudents =
            students.filter(student =>
                student.cgpa >= company.cgpaCutoff
            );


        /*
         * Shuffle eligible students so different
         * companies get different combinations.
         */
        const shuffledStudents =
            shuffle(eligibleStudents);


        const selectedStudents =
            shuffledStudents.slice(
                0,
                Math.min(
                    targetShortlistSize,
                    shuffledStudents.length
                )
            );


        /*
         * Save selected students against company.
         */
        company.shortlistedStudents =
            selectedStudents.map(
                student => student._id
            );


        /*
         * Save company against each student.
         */
        selectedStudents.forEach(student => {

            student.shortlistedCompanies.push(
                company._id
            );
        });
    });


    return {
        companies,
        students
    };
}


// ============================================================
// BOOST HIGH-CGPA STUDENTS
// ============================================================

function boostTopStudentShortlists(
    companies,
    students
) {

    /*
     * Students with CGPA >= 9 are highly competitive.
     *
     * We deliberately make them appear on many
     * company shortlists to create realistic overlap.
     */
    const topStudents =
        students.filter(
            student => student.cgpa >= 9.0
        );


    topStudents.forEach(student => {

        /*
         * Target number of companies:
         * 5 - 10
         */
        const targetCompanyCount =
            randomInteger(5, 10);


        /*
         * Only companies for which the student
         * satisfies the CGPA cutoff.
         */
        const eligibleCompanies =
            companies.filter(company =>
                student.cgpa >= company.cgpaCutoff
            );


        const shuffledCompanies =
            shuffle(eligibleCompanies);


        const selectedCompanies =
            shuffledCompanies.slice(
                0,
                Math.min(
                    targetCompanyCount,
                    shuffledCompanies.length
                )
            );


        selectedCompanies.forEach(company => {

            const alreadyShortlisted =
                student.shortlistedCompanies.some(
                    companyId =>
                        companyId.toString() ===
                        company._id.toString()
                );


            if (!alreadyShortlisted) {

                student.shortlistedCompanies.push(
                    company._id
                );

                company.shortlistedStudents.push(
                    student._id
                );
            }
        });
    });


    return {
        companies,
        students
    };
}


// ============================================================
// COMPLETE DATASET GENERATOR
// ============================================================

function generateDataset() {

    const companies =
        generateCompanies();

    const students =
        generateStudents();

    const rooms =
        generateRooms();

    const panels =
        generatePanels(companies);

    generateShortlists(
        companies,
        students
    );

    boostTopStudentShortlists(
        companies,
        students
    );


    return {
        companies,
        students,
        rooms,
        panels,

        metadata: {
            totalCompanies:
                companies.length,

            totalStudents:
                students.length,

            totalRooms:
                rooms.length,

            totalPanels:
                panels.length,

            totalDays:
                TOTAL_DAYS
        }
    };
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    generateCompanies,

    generateStudents,

    generateRooms,

    generatePanels,

    generateShortlists,

    boostTopStudentShortlists,

    generateTimeSlots,

    generateDataset
};