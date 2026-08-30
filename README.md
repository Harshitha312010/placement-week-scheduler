\# Placement Week Scheduler



A coordinator-focused placement scheduling and disruption-replanning system built for the Mirai Labs Software Developer Intern technical assessment.



\## Overview



Placement weeks involve hundreds of students, multiple companies, interview panels, rooms, availability constraints, and unexpected disruptions.



This project provides:



\- Automated interview scheduling

\- Student, room and panel conflict validation

\- Explicit handling of infeasible interviews

\- Disruption reporting

\- Minimal-change replanning

\- Before/after change diffs

\- Affected people and notification identification

\- Coordinator dashboard and analytics



\## Key Requirements Implemented



The system supports four disruption scenarios:



1\. Student withdrawal

2\. Panel becoming unavailable

3\. Room becoming unavailable

4\. Company arriving late



For disruptions, the system identifies affected interviews, searches for feasible replacements, keeps unaffected appointments unchanged whenever possible, and reports cases that cannot be rescheduled.



\## Features



\### Scheduling



The scheduler generates a realistic placement dataset containing:



\- 35 companies

\- 800 students

\- 20 interview rooms

\- Company-specific interview panels

\- CGPA cutoffs

\- Interview durations

\- Company priority tiers

\- Company availability by day

\- Company availability by time



Each scheduled interview contains:



\- Day

\- Start time

\- End time

\- Company

\- Student

\- Room

\- Panel



\### Constraint Validation



The scheduler checks:



\- No student double booking

\- No room double booking

\- No panel double booking

\- Correct interview duration



When no feasible assignment exists, the interview is reported as unscheduled with an explicit reason.



\## Disruption Replanning



The replanning engine follows a minimal-change approach.



Instead of rebuilding the entire schedule:



1\. Identify affected interviews.

2\. Preserve unaffected appointments.

3\. Temporarily remove an affected appointment while searching for replacements.

4\. Search feasible time, room and panel combinations.

5\. Prefer replacements close to the original appointment.

6\. Apply only necessary changes.

7\. Record a before/after change diff.

8\. Identify people who need to be informed.

9\. Report infeasible interviews explicitly.



\## Change Diff



For moved appointments, the system records changes such as:



\- Time

\- Room

\- Panel

\- Status



Example:



```text

TIME:

Day 1 09:00-09:45

→

Day 1 15:45-16:30



ROOM:

Room 01

→

Room 02



PANEL:

TechNova Panel 1

→

TechNova Panel 2



STATUS:

SCHEDULED

→

MOVED

