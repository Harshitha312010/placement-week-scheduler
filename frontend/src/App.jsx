import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000/api";

const DAYS = [
  "All Days",
  "Day 1",
  "Day 2",
  "Day 3",
  "Day 4",
];

const DISRUPTION_TYPES = [
  "Student Withdrawal",
  "Panel Unavailable",
  "Room Unavailable",
  "Company Delay",
];

function App() {
  // ==========================================================
  // PAGE
  // ==========================================================

  const [activePage, setActivePage] =
    useState("dashboard");

  // ==========================================================
  // BACKEND DATA
  // ==========================================================

  const [dashboard, setDashboard] =
    useState(null);

  const [schedule, setSchedule] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================================
  // SCHEDULE FILTERS
  // ==========================================================

  const [selectedDay, setSelectedDay] =
    useState("All Days");

  const [scheduleCompany, setScheduleCompany] =
    useState("All Companies");

  const [search, setSearch] =
    useState("");

  // ==========================================================
  // DISRUPTION FORM
  // ==========================================================

  const [showDisruption, setShowDisruption] =
    useState(false);

  const [disruptionType, setDisruptionType] =
    useState("Student Withdrawal");

  const [selectedStudent, setSelectedStudent] =
    useState("");

  // IMPORTANT:
  // This is separate from the schedule company filter.
  const [selectedDisruptionCompany, setSelectedDisruptionCompany] =
    useState("");

  const [selectedPanel, setSelectedPanel] =
    useState("");

  const [selectedRoom, setSelectedRoom] =
    useState("");

  const [delayHours, setDelayHours] =
    useState(2);

  const [reason, setReason] = useState(
    "Student is no longer available for the scheduled interview."
  );

  const [replanning, setReplanning] =
    useState(false);

  // ==========================================================
  // REPLAN RESULTS
  // ==========================================================

  const [replanHistory, setReplanHistory] =
    useState([]);

  const [lastReplan, setLastReplan] =
    useState(null);

  const [message, setMessage] =
    useState("");

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      }

      setError("");

      const [
        dashboardResponse,
        scheduleResponse,
      ] = await Promise.all([
        fetch(`${API_BASE}/dashboard`),
        fetch(`${API_BASE}/schedule`),
      ]);

      if (!dashboardResponse.ok) {
        throw new Error(
          "Dashboard request failed."
        );
      }

      if (!scheduleResponse.ok) {
        throw new Error(
          "Schedule request failed."
        );
      }

      const dashboardJson =
        await dashboardResponse.json();

      const scheduleJson =
        await scheduleResponse.json();

      if (!dashboardJson.success) {
        throw new Error(
          dashboardJson.message ||
            "Invalid dashboard response."
        );
      }

      if (!scheduleJson.success) {
        throw new Error(
          scheduleJson.message ||
            "Invalid schedule response."
        );
      }

      setDashboard(
        dashboardJson.data
      );

      setSchedule(
        Array.isArray(scheduleJson.schedule)
          ? scheduleJson.schedule
          : []
      );

    } catch (err) {
      console.error(
        "Load error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================================
  // OPTIONS FROM REAL SCHEDULE
  // ==========================================================

  const companyOptions = useMemo(() => {
    const names = [
      ...new Set(
        schedule
          .map(
            (item) =>
              item.companyName
          )
          .filter(Boolean)
      ),
    ].sort();

    return [
      "All Companies",
      ...names,
    ];
  }, [schedule]);

  const studentOptions = useMemo(() => {
    return [
      ...new Set(
        schedule
          .map(
            (item) =>
              item.studentName
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [schedule]);

  const panelOptions = useMemo(() => {
    return [
      ...new Set(
        schedule
          .map(
            (item) =>
              item.panelName
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [schedule]);

  const roomOptions = useMemo(() => {
    return [
      ...new Set(
        schedule
          .map(
            (item) =>
              item.roomName
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [schedule]);

  // ==========================================================
  // FILTERED SCHEDULE
  // ==========================================================

  const filteredSchedule = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return schedule.filter((item) => {
      const matchesDay =
        selectedDay === "All Days" ||
        `Day ${item.day}` === selectedDay;

      const matchesCompany =
        scheduleCompany ===
          "All Companies" ||
        item.companyName ===
          scheduleCompany;

      const matchesSearch =
        !searchValue ||
        String(
          item.studentName || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          item.companyName || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          item.roomName || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          item.panelName || ""
        )
          .toLowerCase()
          .includes(searchValue);

      return (
        matchesDay &&
        matchesCompany &&
        matchesSearch
      );
    });
  }, [
    schedule,
    selectedDay,
    scheduleCompany,
    search,
  ]);

  // ==========================================================
  // FILTER RESET
  // ==========================================================

  function resetFilters() {
    setSelectedDay("All Days");
    setScheduleCompany("All Companies");
    setSearch("");
  }

  // ==========================================================
  // DISRUPTION DEFAULT REASON
  // ==========================================================

  function getReason(type) {
    switch (type) {
      case "Student Withdrawal":
        return "Student is no longer available for the scheduled interview.";

      case "Panel Unavailable":
        return "Interview panel has become unavailable.";

      case "Room Unavailable":
        return "Interview room has become unavailable.";

      case "Company Delay":
        return "Company has reported a delayed arrival.";

      default:
        return "";
    }
  }

  // ==========================================================
  // OPEN DISRUPTION
  // ==========================================================

  function openDisruptionModal() {
    setShowDisruption(true);

    if (!selectedStudent) {
      setSelectedStudent(
        studentOptions[0] || ""
      );
    }

    if (!selectedDisruptionCompany) {
      setSelectedDisruptionCompany(
        companyOptions.find(
          (company) =>
            company !== "All Companies"
        ) || ""
      );
    }

    if (!selectedPanel) {
      setSelectedPanel(
        panelOptions[0] || ""
      );
    }

    if (!selectedRoom) {
      setSelectedRoom(
        roomOptions[0] || ""
      );
    }

    setReason(
      getReason(disruptionType)
    );
  }

  function closeDisruptionModal() {
    if (!replanning) {
      setShowDisruption(false);
    }
  }

  function handleTypeChange(type) {
    setDisruptionType(type);
    setReason(getReason(type));
  }

  // ==========================================================
  // REAL REPLAN API
  // ==========================================================

  async function handleDisruptionSubmit() {
    try {
      setReplanning(true);
      setMessage(
        "Applying disruption and replanning..."
      );

      let apiType;

      switch (disruptionType) {
        case "Student Withdrawal":
          apiType =
            "STUDENT_WITHDRAWAL";
          break;

        case "Panel Unavailable":
          apiType =
            "PANEL_DROP";
          break;

        case "Room Unavailable":
          apiType =
            "ROOM_UNAVAILABLE";
          break;

        case "Company Delay":
          apiType =
            "COMPANY_DELAY";
          break;

        default:
          throw new Error(
            "Invalid disruption type."
          );
      }

      const requestBody = {
        type: apiType,
      };

      if (
        apiType ===
        "STUDENT_WITHDRAWAL"
      ) {
        requestBody.studentName =
          selectedStudent;
      }

      if (
        apiType ===
        "PANEL_DROP"
      ) {
        requestBody.panelName =
          selectedPanel;
      }

      if (
        apiType ===
        "ROOM_UNAVAILABLE"
      ) {
        requestBody.roomName =
          selectedRoom;
      }

      if (
        apiType ===
        "COMPANY_DELAY"
      ) {
        requestBody.companyName =
          selectedDisruptionCompany;

        requestBody.delayHours =
          Number(delayHours);
      }

      const response = await fetch(
        `${API_BASE}/replan`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify(
              requestBody
            ),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Replanning failed."
        );
      }

      // ------------------------------------------------------
      // Store REAL backend result
      // ------------------------------------------------------

      const record = {
        id:
          `DIS-${Date.now()}`,

        type:
          disruptionType,

        summary:
          data.summary,

        changes:
          Array.isArray(data.changes)
            ? data.changes
            : [],

        unscheduled:
          Array.isArray(data.unscheduled)
            ? data.unscheduled
            : [],

        notifications: [
          ...new Set(
            (data.changes || []).flatMap(
              (change) =>
                Array.isArray(
                  change.notifications
                )
                  ? change.notifications
                  : []
            )
          ),
        ],

        affectedInterviewIds:
          data.affectedInterviewIds ||
          [],

        createdAt:
          new Date().toLocaleTimeString(),

        status:
          "REPLAN COMPLETE",
      };

      setLastReplan(record);

      setReplanHistory(
        (current) => [
          record,
          ...current,
        ]
      );

      // Reload current backend state.
      await loadData(true);

      setShowDisruption(false);
      setActivePage("disruptions");

      setMessage(
        `Replan complete: ${data.summary.moved} moved, ${data.summary.cancelled} cancelled, ${data.summary.unscheduled} unscheduled.`
      );

      setTimeout(() => {
        setMessage("");
      }, 7000);

    } catch (err) {
      console.error(
        "Replan error:",
        err
      );

      setMessage(
        err.message ||
          "Unable to replan schedule."
      );
    } finally {
      setReplanning(false);
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">

          <div className="loading-spinner"></div>

          <h2>
            Loading Placement Scheduler
          </h2>

          <p>
            Connecting to the scheduling engine...
          </p>

        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error && !dashboard) {
    return (
      <div className="error-screen">
        <div className="error-card">

          <div className="error-icon">
            !
          </div>

          <h2>
            Backend connection failed
          </h2>

          <p>
            {error}
          </p>

          <button
            className="primary-btn"
            onClick={() =>
              loadData(true)
            }
          >
            Retry connection
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="app">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            PW
          </div>

          <div>
            <h2>
              Placement Week
            </h2>

            <span>
              Scheduler
            </span>
          </div>

        </div>


        <nav className="nav">

          <SidebarButton
            active={
              activePage === "dashboard"
            }
            icon="⌂"
            label="Dashboard"
            onClick={() =>
              setActivePage(
                "dashboard"
              )
            }
          />

          <SidebarButton
            active={
              activePage === "schedule"
            }
            icon="▦"
            label="Schedule"
            onClick={() =>
              setActivePage(
                "schedule"
              )
            }
          />

          <SidebarButton
            active={
              activePage ===
              "disruptions"
            }
            icon="⚠"
            label="Disruptions"
            count={
              replanHistory.length
            }
            onClick={() =>
              setActivePage(
                "disruptions"
              )
            }
          />

          <SidebarButton
            active={
              activePage ===
              "analytics"
            }
            icon="◔"
            label="Analytics"
            onClick={() =>
              setActivePage(
                "analytics"
              )
            }
          />

        </nav>


        <div className="sidebar-bottom">

          <div className="system-status">
            <span className="status-dot"></span>
            System operational
          </div>

          <div className="version">
            Placement Week v1.0
          </div>

        </div>

      </aside>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="main">

        <header className="topbar">

          <div>

            <p className="eyebrow">
              COORDINATOR CONSOLE
            </p>

            <h1>
              Placement Week Dashboard
            </h1>

            <p className="subtitle">
              Manage interviews, resources and
              disruptions across the placement week.
            </p>

          </div>


          <div className="topbar-actions">

            <div className="live">
              <span></span>
              Live
            </div>

            <button
              className="primary-btn"
              onClick={
                openDisruptionModal
              }
            >
              + Report Disruption
            </button>

          </div>

        </header>


        {message && (
          <div className="notification">
            <span>✓</span>
            {message}
          </div>
        )}


        {/* ====================================================
            DASHBOARD
        ==================================================== */}

        {activePage ===
          "dashboard" && (

          <>
            <section className="metrics">

              <MetricCard
                icon="👥"
                type="students"
                label="Students"
                value={
                  dashboard.students
                }
                description="Eligible candidates"
              />

              <MetricCard
                icon="◈"
                type="companies"
                label="Companies"
                value={
                  dashboard.companies
                }
                description="Participating"
              />

              <MetricCard
                icon="✓"
                type="scheduled"
                label="Scheduled"
                value={
                  dashboard.scheduled
                }
                description="Current schedule"
              />

              <MetricCard
                icon="!"
                type="pending"
                label="Unscheduled"
                value={
                  dashboard.unscheduled
                }
                description="Needs allocation"
              />

            </section>


            <section className="status-grid">

              <div className="status-card">

                <div className="status-header">

                  <div>

                    <span className="section-label">
                      SCHEDULE HEALTH
                    </span>

                    <h3>
                      Constraint validation
                    </h3>

                  </div>

                  <span
                    className={
                      dashboard.validation.valid
                        ? "healthy"
                        : "unhealthy"
                    }
                  >
                    {
                      dashboard.validation.valid
                        ? "VALID"
                        : "ISSUES"
                    }
                  </span>

                </div>


                <div className="checks">

                  <ValidationCheck
                    label="Student conflicts"
                    value={
                      dashboard
                        .validation
                        .studentConflicts
                    }
                  />

                  <ValidationCheck
                    label="Room conflicts"
                    value={
                      dashboard
                        .validation
                        .roomConflicts
                    }
                  />

                  <ValidationCheck
                    label="Panel conflicts"
                    value={
                      dashboard
                        .validation
                        .panelConflicts
                    }
                  />

                  <ValidationCheck
                    label="Duration errors"
                    value={
                      dashboard
                        .validation
                        .durationErrors
                    }
                  />

                </div>

              </div>


              <div className="status-card capacity">

                <div className="status-header">

                  <div>

                    <span className="section-label">
                      RESOURCE USAGE
                    </span>

                    <h3>
                      Room utilization
                    </h3>

                  </div>

                  <strong className="big-number">
                    {
                      dashboard.roomUtilization
                    }%
                  </strong>

                </div>


                <div className="progress">

                  <div
                    className="progress-bar"
                    style={{
                      width: `${Math.min(
                        dashboard.roomUtilization,
                        100
                      )}%`,
                    }}
                  ></div>

                </div>


                <p>
                  {dashboard.rooms} interview
                  rooms available.
                </p>

              </div>

            </section>


            <section className="schedule-card">

              <div className="section-heading">

                <div>

                  <span className="section-label">
                    INTERVIEW ALLOCATION
                  </span>

                  <h2>
                    Current Schedule
                  </h2>

                </div>

                <button
                  className="outline-btn"
                  onClick={() =>
                    setActivePage(
                      "schedule"
                    )
                  }
                >
                  View full schedule →
                </button>

              </div>


              <ScheduleFilters
                selectedDay={selectedDay}
                setSelectedDay={
                  setSelectedDay
                }
                selectedCompany={
                  scheduleCompany
                }
                setSelectedCompany={
                  setScheduleCompany
                }
                search={search}
                setSearch={setSearch}
                companyOptions={
                  companyOptions
                }
                onReset={
                  resetFilters
                }
              />


              <ScheduleTable
                schedule={
                  filteredSchedule.slice(
                    0,
                    10
                  )
                }
              />

            </section>
          </>
        )}


        {/* ====================================================
            SCHEDULE
        ==================================================== */}

        {activePage ===
          "schedule" && (

          <section className="page-card">

            <div className="section-heading">

              <div>
                <span className="section-label">
                  PLACEMENT WEEK
                </span>

                <h2>
                  Complete Interview Schedule
                </h2>
              </div>

              <span className="record-count">
                {
                  filteredSchedule.length
                }{" "}
                records
              </span>

            </div>


            <ScheduleFilters
              selectedDay={selectedDay}
              setSelectedDay={
                setSelectedDay
              }
              selectedCompany={
                scheduleCompany
              }
              setSelectedCompany={
                setScheduleCompany
              }
              search={search}
              setSearch={setSearch}
              companyOptions={
                companyOptions
              }
              onReset={resetFilters}
            />


            <ScheduleTable
              schedule={
                filteredSchedule
              }
              showDay
              showId
            />

          </section>
        )}


        {/* ====================================================
            DISRUPTIONS
        ==================================================== */}

        {activePage ===
          "disruptions" && (

          <section className="page-card">

            <div className="section-heading">

              <div>

                <span className="section-label">
                  DISRUPTION MANAGEMENT
                </span>

                <h2>
                  Schedule Disruptions
                </h2>

                <p className="page-description">
                  Record unexpected events and replan
                  only the affected appointments.
                </p>

              </div>


              <button
                className="primary-btn"
                onClick={
                  openDisruptionModal
                }
              >
                + Report Disruption
              </button>

            </div>


            <div className="disruption-summary">

              <div className="disruption-stat">

                <span>
                  Replans
                </span>

                <strong>
                  {replanHistory.length}
                </strong>

                <small>
                  This session
                </small>

              </div>


              <div className="disruption-stat">

                <span>
                  Total affected
                </span>

                <strong>
                  {replanHistory.reduce(
                    (sum, item) =>
                      sum +
                      Number(
                        item.summary
                          ?.affectedInterviews ||
                        0
                      ),
                    0
                  )}
                </strong>

                <small>
                  Across recorded replans
                </small>

              </div>


              <div className="disruption-stat">

                <span>
                  Last replan
                </span>

                <strong>
                  {lastReplan
                    ? "Complete"
                    : "—"}
                </strong>

                <small>
                  Backend engine
                </small>

              </div>

            </div>


            <div className="disruption-info">

              <div className="info-icon">
                !
              </div>

              <div>

                <h3>
                  Minimal-change replanning
                </h3>

                <p>
                  The system identifies affected interviews,
                  searches for feasible replacements, and
                  keeps unaffected appointments unchanged.
                </p>

              </div>

            </div>


            {/* ==================================================
                LATEST REPLAN
            ================================================== */}

            {lastReplan && (

              <div className="replan-result-card">

                <div className="replan-result-header">

                  <div>

                    <span className="section-label">
                      LATEST REPLAN
                    </span>

                    <h3>
                      {lastReplan.type}
                    </h3>

                  </div>

                  <span className="replan-success">
                    ✓ COMPLETE
                  </span>

                </div>


                <div className="replan-stats">

                  <ResultStat
                    label="Affected"
                    value={
                      lastReplan.summary
                        .affectedInterviews
                    }
                  />

                  <ResultStat
                    label="Moved"
                    value={
                      lastReplan.summary
                        .moved
                    }
                  />

                  <ResultStat
                    label="Cancelled"
                    value={
                      lastReplan.summary
                        .cancelled
                    }
                  />

                  <ResultStat
                    label="Unscheduled"
                    value={
                      lastReplan.summary
                        .unscheduled
                    }
                  />

                  <ResultStat
                    label="Unchanged"
                    value={
                      lastReplan.summary
                        .unchanged
                  }
                  />

                </div>


                {/* CHANGE DIFF */}

                {lastReplan.changes.length >
                  0 && (

                  <div className="change-summary">

                    <h4>
                      Change Diff
                    </h4>

                    {lastReplan.changes
                      .slice(0, 15)
                      .map(
                        (change) => (

                          <div
                            className="change-row"
                            key={
                              change.interviewId
                            }
                          >

                            <div className="change-person">

                              <strong>
                                {
                                  change.interviewId
                                }
                              </strong>

                              <span>
                                {
                                  change.studentName
                                }
                                {" · "}
                                {
                                  change.companyName
                                }
                              </span>

                            </div>


                            <div className="change-values">

                              {(
                                change.changes ||
                                []
                              ).map(
                                (
                                  item,
                                  index
                                ) => (

                                  <span
                                    key={
                                      `${change.interviewId}-${index}`
                                    }
                                  >
                                    <strong>
                                      {
                                        item.field
                                      }
                                    </strong>
                                    {": "}
                                    {
                                      item.from
                                    }
                                    {" → "}
                                    {
                                      item.to
                                    }
                                  </span>

                                )
                              )}

                            </div>

                          </div>

                        )
                      )}

                    {lastReplan.changes
                      .length > 15 && (

                      <p className="more-changes">
                        +
                        {" "}
                        {
                          lastReplan.changes
                            .length - 15
                        }{" "}
                        more changes
                      </p>

                    )}

                  </div>

                )}


                {/* PEOPLE TO NOTIFY */}

                {lastReplan.notifications
                  .length > 0 && (

                  <div className="notification-list">

                    <h4>
                      People to Notify
                    </h4>

                    <div className="notification-tags">

                      {lastReplan.notifications.map(
                        (person) => (

                          <span
                            key={person}
                          >
                            {person}
                          </span>

                        )
                      )}

                    </div>

                  </div>

                )}


                {/* UNSCHEDULED */}

                {lastReplan.unscheduled
                  .length > 0 && (

                  <div className="replan-warning">

                    <strong>
                      {
                        lastReplan.unscheduled
                          .length
                      }{" "}
                      interviews could not be
                      rescheduled
                    </strong>

                    <p>
                      These interviews remain explicitly
                      reported with their reason.
                    </p>

                  </div>

                )}

              </div>

            )}


            {/* HISTORY */}

            <div className="recent-section">

              <div className="section-heading">

                <div>

                  <span className="section-label">
                    ACTIVITY
                  </span>

                  <h3>
                    Recent disruptions
                  </h3>

                </div>

              </div>


              {replanHistory.length ===
                0 ? (

                <div className="empty-disruptions">

                  <div className="empty-icon">
                    ✓
                  </div>

                  <h3>
                    No disruptions reported
                  </h3>

                  <p>
                    The placement schedule is currently
                    operating normally.
                  </p>

                  <button
                    className="outline-btn"
                    onClick={
                      openDisruptionModal
                    }
                  >
                    Report a disruption
                  </button>

                </div>

              ) : (

                <div className="disruption-list">

                  {replanHistory.map(
                    (item) => (

                      <div
                        className="disruption-item"
                        key={item.id}
                      >

                        <div className="disruption-main">

                          <div className="disruption-type-icon">
                            ⚠
                          </div>

                          <div>

                            <strong>
                              {item.type}
                            </strong>

                            <small>
                              {item.createdAt}
                            </small>

                          </div>

                        </div>


                        <div className="disruption-details">

                          <div>
                            <span>
                              Status
                            </span>

                            <strong className="success-badge">
                              {item.status}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Affected
                            </span>

                            <strong>
                              {
                                item.summary
                                  ?.affectedInterviews ??
                                0
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Moved
                            </span>

                            <strong>
                              {
                                item.summary
                                  ?.moved ??
                                0
                              }
                            </strong>
                          </div>

                          <div>
                            <span>
                              Cancelled
                            </span>

                            <strong>
                              {
                                item.summary
                                  ?.cancelled ??
                                0
                              }
                            </strong>
                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </section>
        )}


        {/* ====================================================
            ANALYTICS
        ==================================================== */}

        {activePage ===
          "analytics" && (

          <section className="page-card">

            <span className="section-label">
              PERFORMANCE
            </span>

            <h2>
              Scheduling Analytics
            </h2>


            <div className="analytics-grid">

              <AnalyticsItem
                label="Scheduling percentage"
                value={`${dashboard.schedulingPercentage}%`}
                description="Current backend result"
              />

              <AnalyticsItem
                label="Room utilization"
                value={`${dashboard.roomUtilization}%`}
                description={`${dashboard.rooms} rooms`}
              />

              <AnalyticsItem
                label="Constraint violations"
                value={
                  dashboard.validation
                    .studentConflicts +
                  dashboard.validation
                    .roomConflicts +
                  dashboard.validation
                    .panelConflicts +
                  dashboard.validation
                    .durationErrors
                }
                description="Hard constraints"
              />

              <AnalyticsItem
                label="Student conflicts"
                value={
                  dashboard.validation
                    .studentConflicts
                }
                description="Double bookings"
              />

              <AnalyticsItem
                label="Room conflicts"
                value={
                  dashboard.validation
                    .roomConflicts
                }
                description="Double bookings"
              />

              <AnalyticsItem
                label="Panel conflicts"
                value={
                  dashboard.validation
                    .panelConflicts
                }
                description="Double bookings"
              />

            </div>


            <div className="analytics-note">

              <strong>
                Live backend metrics
              </strong>

              <p>
                These values are retrieved from the
                Node.js scheduling API.
              </p>

            </div>

          </section>
        )}

      </main>


      {/* ======================================================
          DISRUPTION MODAL
      ====================================================== */}

      {showDisruption && (

        <div
          className="modal-overlay"
          onClick={() => {
            if (!replanning) {
              closeDisruptionModal();
            }
          }}
        >

          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="section-label">
                  DISRUPTION MANAGEMENT
                </span>

                <h2>
                  Report a Disruption
                </h2>

              </div>


              <button
                className="close"
                onClick={
                  closeDisruptionModal
                }
                disabled={replanning}
              >
                ×
              </button>

            </div>


            <p className="modal-description">
              Select a disruption and run the real
              backend replanning engine.
            </p>


            {/* TYPE */}

            <label>

              Disruption type

              <select
                value={disruptionType}
                onChange={(event) =>
                  handleTypeChange(
                    event.target.value
                  )
                }
                disabled={replanning}
              >

                {DISRUPTION_TYPES.map(
                  (type) => (

                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>

                  )
                )}

              </select>

            </label>


            {/* STUDENT */}

            {disruptionType ===
              "Student Withdrawal" && (

              <label>

                Student

                <select
                  value={selectedStudent}
                  onChange={(event) =>
                    setSelectedStudent(
                      event.target.value
                    )
                  }
                  disabled={
                    replanning
                  }
                >

                  {studentOptions.map(
                    (student) => (

                      <option
                        key={student}
                        value={student}
                      >
                        {student}
                      </option>

                    )
                  )}

                </select>

              </label>

            )}


            {/* PANEL */}

            {disruptionType ===
              "Panel Unavailable" && (

              <label>

                Panel

                <select
                  value={selectedPanel}
                  onChange={(event) =>
                    setSelectedPanel(
                      event.target.value
                    )
                  }
                  disabled={
                    replanning
                  }
                >

                  {panelOptions.map(
                    (panel) => (

                      <option
                        key={panel}
                        value={panel}
                      >
                        {panel}
                      </option>

                    )
                  )}

                </select>

              </label>

            )}


            {/* ROOM */}

            {disruptionType ===
              "Room Unavailable" && (

              <label>

                Room

                <select
                  value={selectedRoom}
                  onChange={(event) =>
                    setSelectedRoom(
                      event.target.value
                    )
                  }
                  disabled={
                    replanning
                  }
                >

                  {roomOptions.map(
                    (room) => (

                      <option
                        key={room}
                        value={room}
                      >
                        {room}
                      </option>

                    )
                  )}

                </select>

              </label>

            )}


            {/* COMPANY DELAY */}

            {disruptionType ===
              "Company Delay" && (

              <>

                <label>

                  Company

                  <select
                    value={
                      selectedDisruptionCompany
                    }
                    onChange={(event) =>
                      setSelectedDisruptionCompany(
                        event.target.value
                      )
                    }
                    disabled={
                      replanning
                    }
                  >

                    {companyOptions
                      .filter(
                        (company) =>
                          company !==
                          "All Companies"
                      )
                      .map(
                        (company) => (

                          <option
                            key={company}
                            value={company}
                          >
                            {company}
                          </option>

                        )
                      )}

                  </select>

                </label>


                <label>

                  Delay

                  <select
                    value={delayHours}
                    onChange={(event) =>
                      setDelayHours(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    disabled={
                      replanning
                    }
                  >

                    <option value={1}>
                      1 hour
                    </option>

                    <option value={2}>
                      2 hours
                    </option>

                    <option value={3}>
                      3 hours
                    </option>

                    <option value={4}>
                      4 hours
                    </option>

                  </select>

                </label>

              </>

            )}


            {/* REASON */}

            <label>

              Reason

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value
                  )
                }
                disabled={replanning}
                placeholder="Describe the disruption..."
              />

            </label>


            {/* BUTTONS */}

            <div className="modal-actions">

              <button
                className="outline-btn"
                onClick={
                  closeDisruptionModal
                }
                disabled={replanning}
              >
                Cancel
              </button>


              <button
                className="primary-btn"
                onClick={
                  handleDisruptionSubmit
                }
                disabled={
                  replanning
                }
              >
                {replanning
                  ? "Replanning..."
                  : "Report & Replan"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


/* ============================================================
   SIDEBAR BUTTON
============================================================ */

function SidebarButton({
  active,
  icon,
  label,
  count,
  onClick,
}) {
  return (
    <button
      className={
        active
          ? "nav-item active"
          : "nav-item"
      }
      onClick={onClick}
    >
      <span>
        {icon}
      </span>

      {label}

      {count > 0 && (
        <span className="nav-count">
          {count}
        </span>
      )}
    </button>
  );
}


/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  icon,
  type,
  label,
  value,
  description,
}) {
  return (
    <div className="metric-card">

      <div
        className={
          `metric-icon ${type}`
        }
      >
        {icon}
      </div>

      <div>

        <span className="metric-label">
          {label}
        </span>

        <strong>
          {Number(value).toLocaleString()}
        </strong>

        <small>
          {description}
        </small>

      </div>

    </div>
  );
}


/* ============================================================
   VALIDATION CHECK
============================================================ */

function ValidationCheck({
  label,
  value,
}) {
  const valid =
    Number(value) === 0;

  return (
    <div>

      <span
        className={
          valid
            ? ""
            : "check-error"
        }
      >
        {valid ? "✓" : "!"}
      </span>

      {label}

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* ============================================================
   RESULT STAT
============================================================ */

function ResultStat({
  label,
  value,
}) {
  return (
    <div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* ============================================================
   ANALYTICS ITEM
============================================================ */

function AnalyticsItem({
  label,
  value,
  description,
}) {
  return (
    <div className="analytics-item">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {description}
      </small>

    </div>
  );
}


/* ============================================================
   FILTERS
============================================================ */

function ScheduleFilters({
  selectedDay,
  setSelectedDay,
  selectedCompany,
  setSelectedCompany,
  search,
  setSearch,
  companyOptions,
  onReset,
}) {
  return (
    <div className="filters">

      <select
        value={selectedDay}
        onChange={(event) =>
          setSelectedDay(
            event.target.value
          )
        }
      >

        {DAYS.map((day) => (

          <option
            key={day}
            value={day}
          >
            {day}
          </option>

        ))}

      </select>


      <select
        value={selectedCompany}
        onChange={(event) =>
          setSelectedCompany(
            event.target.value
          )
        }
      >

        {companyOptions.map(
          (company) => (

            <option
              key={company}
              value={company}
            >
              {company}
            </option>

          )
        )}

      </select>


      <input
        value={search}
        onChange={(event) =>
          setSearch(
            event.target.value
          )
        }
        placeholder="Search student, company, room..."
      />


      <button
        className="clear-btn"
        onClick={onReset}
      >
        Reset
      </button>

    </div>
  );
}


/* ============================================================
   SCHEDULE TABLE
============================================================ */

function ScheduleTable({
  schedule,
  showDay = false,
  showId = false,
}) {
  return (
    <div className="table-wrapper">

      <table>

        <thead>

          <tr>

            {showId && (
              <th>ID</th>
            )}

            {showDay && (
              <th>DAY</th>
            )}

            <th>TIME</th>
            <th>COMPANY</th>
            <th>STUDENT</th>
            <th>ROOM</th>
            <th>PANEL</th>
            <th>STATUS</th>

          </tr>

        </thead>


        <tbody>

          {schedule.map(
            (item) => (

              <tr
                key={item.id}
              >

                {showId && (
                  <td>
                    <span className="id-tag">
                      {item.id}
                    </span>
                  </td>
                )}


                {showDay && (
                  <td>
                    Day {item.day}
                  </td>
                )}


                <td>

                  <strong>
                    {item.startTime}
                  </strong>

                  <span className="end-time">
                    {item.endTime}
                  </span>

                </td>


                <td>

                  <div className="company-cell">

                    <span className="company-avatar">
                      {String(
                        item.companyName ||
                          "?"
                      ).charAt(0)}
                    </span>

                    <div>

                      <strong>
                        {item.companyName}
                      </strong>

                      <small>
                        {item.duration} min
                      </small>

                    </div>

                  </div>

                </td>


                <td>
                  {item.studentName}
                </td>


                <td>
                  {item.roomName}
                </td>


                <td>
                  {item.panelName}
                </td>


                <td>

                  <span
                    className={
                      item.status ===
                      "MOVED"
                        ? "moved-badge"
                        : item.status ===
                          "CANCELLED"
                        ? "cancelled-badge"
                        : "scheduled-badge"
                    }
                  >
                    ●{" "}
                    {item.status ||
                      "SCHEDULED"}
                  </span>

                </td>

              </tr>

            )
          )}

        </tbody>

      </table>


      {schedule.length === 0 && (
        <div className="empty">
          No interviews match your filters.
        </div>
      )}

    </div>
  );
}

export default App;