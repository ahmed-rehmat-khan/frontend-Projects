# HireSpera --- Master Architecture Prompt

## Project Identity

-   **Product name:** HireSpera
-   **Tagline:** Build Teams. Build Tomorrow.
-   **Project:** HCM Lite --- Saylani Hackathon Beginner Track
-   **Purpose:** Build a small, responsive HR web application for an
    Admin and Employees.
-   **Visual theme:** Dark navy/black background with HireSpera purple
    and blue accents. Use a clean, modern, professional dashboard style,
    readable typography, restrained glow/gradient accents, and clear
    status colors. Keep the interface responsive and easy to use.
-   **Scope rule:** Follow the supplied assignment PDF exactly. Do not
    add bonus features, extra pages, extra modules, integrations, or
    functionality not listed in this document.

## Non-Negotiable Technical Constraints

1.  Use **HTML, CSS, and vanilla JavaScript only**.
2.  Do **not** use a framework.
3.  Do **not** build a backend or connect a database.
4.  Store application data in browser **localStorage**.
5.  The app starts empty. Do not seed it with dummy employees,
    attendance, leaves, or dashboard totals.
6.  Every dashboard number must be calculated from actions and data
    created inside the app.
7.  Make the application responsive and usable on phones.
8.  Use reusable storage helpers in `js/storage.js`.
9.  Enforce role-based access on every page: Admin can access Admin
    functions; Employees can access only their own data and employee
    functions.
10. Do not implement optional bonus ideas such as camera check-in,
    geolocation, face detection, charts, dark-mode toggle, CSV export,
    or extra reports.

## Required Application Pages --- Exactly 7

Create these seven pages and no additional application pages:

1.  **`index.html` --- Login and First-Run Setup**
    -   On first run, create the company and the Admin account.
    -   Provide login and logout.
    -   Support changing the logged-in user's password.
    -   Validate required fields and email format.
    -   Do not allow duplicate email addresses.
2.  **`admin.html` --- Admin Dashboard**
    -   Show company totals and today's attendance from saved app data.
    -   Show pending leave requests.
    -   Include the required data-based Smart Helper.
    -   Include access to Admin functions.
3.  **`employees.html` --- Employee Management**
    -   Admin can add, edit, delete, search, and filter employees by
        department.
    -   Adding an employee also creates that employee's login.
    -   Validate required fields, valid email, unique email, and salary
        greater than zero.
4.  **`leaves.html` --- Leave Requests**
    -   Admin can view leave requests.
    -   Admin can approve or reject a request and add a comment.
    -   Update leave status and balances according to the assignment
        rules.
5.  **`settings.html` --- Company Settings**
    -   Admin can set office start time, grace minutes, yearly leave
        quota, and working days.
    -   These settings must drive attendance and leave rules.
6.  **`employee.html` --- Employee Dashboard**
    -   Employee can check in and check out.
    -   Employee can view their own attendance.
    -   Employee can apply for leave and see request status and leave
        balance.
    -   Include the required data-based Smart Helper.
    -   Employee must not see another employee's records.
7.  **`payslip.html` --- Monthly Payslip**
    -   Show a monthly salary slip for the appropriate user.
    -   Admin can view payslips for employees; Employee can view only
        their own.
    -   Include salary, deductions, and net salary.
    -   Provide print / save as PDF using the browser's print
        capability.

## Roles and Permissions

-   **Admin:** manages company setup and settings; adds, edits, and
    deletes employees; views all attendance; approves or rejects leave
    with a comment; sees company dashboard totals; can view employee
    payslips; can post announcements; can ask the Smart Helper about
    company data.
-   **Employee:** logs in and logs out; changes own password; checks in
    and out; views only own attendance; applies for leave and views own
    status/balance; views own payslip; reads announcements; asks the
    Smart Helper about own data.
-   If an Employee opens an Admin page, redirect them to their own
    employee dashboard.
-   Do not grant Employees access to company-wide records or Admin
    controls.

## Required Business Rules

### Attendance

-   Admin defines office start time and grace minutes.
-   An employee may check in only once per day.
-   Check-out is allowed only after check-in.
-   Mark **Late** when check-in is after office start time plus grace
    minutes.
-   Work hours = check-out time minus check-in time.
-   If work hours are **under 5 hours**, mark **Half Day**.
-   If there is no attendance record on a working day, mark **Absent**.
-   Attendance records must be stored per employee per date.
-   Use the Admin's settings for all attendance calculations.

### Leave

-   From date must be on or before To date.
-   Count working days only; skip weekends.
-   Do not allow overlapping leave requests.
-   Do not allow a request to exceed the yearly quota set by Admin.
-   Employee applies; Admin approves or rejects and may add a comment.
-   Leave balance must update based on approved leave, not pending or
    rejected requests.
-   Employee can view only their own leave requests and balance.

### Payslip

Use the assignment's formulas:

-   `Per day salary = monthly salary / working days in the month`
-   `Deduction = per day salary × (absent days + 0.5 × half days)`
-   `Net salary = monthly salary − deduction`

Use the relevant employee's attendance for the selected month. Do not
invent additional payroll rules or deductions.

### Forms and Validation

-   Required fields must be validated.
-   Email must be valid and unique.
-   Salary must be greater than zero.
-   Show validation errors next to the relevant field.
-   Prevent invalid dates, duplicate daily check-ins, check-out without
    check-in, overlapping leave, and leave beyond the Admin quota.

## Required localStorage Keys

Use these keys and their intended data:

-   `hcm_company` --- company name and settings: office start time,
    grace minutes, leave quota, working days.
-   `hcm_users` --- Admin and employee users: id, name, email, password,
    role, department, salary.
-   `hcm_attendance` --- attendance entries: employee id, date,
    check-in, check-out, status.
-   `hcm_leaves` --- leave requests: employee id, type, from, to, days,
    reason, status, comment.
-   `hcm_session` --- currently logged-in user/session.

Keep read/write helpers in `js/storage.js` and reuse them throughout the
pages. Parse localStorage safely and handle missing keys as empty data
or an uninitialized setup state.

## Required Smart Helper

Add a small chat box to both Admin and Employee dashboards.

-   The helper answers using the application's own saved data.
-   Required implementation: simple JavaScript keyword matching, such as
    checking `text.includes(...)`, and return real computed values.
-   Admin questions must be based on company data, including:
    -   employee count
    -   who is on approved leave today
    -   who was late today
-   Employee questions must be based only on that employee's data,
    including:
    -   remaining leave balance
    -   whether they were late today
    -   hours worked this week
-   Employees must never receive company-wide or other employees' data.
-   Do not make the LLM/API bonus a required feature. Do not add an
    external AI integration.

## Required File Organization

Use the assignment's suggested organization:

``` text
HireSpera/
├── index.html
├── pages/
│   ├── admin.html
│   ├── employees.html
│   ├── leaves.html
│   ├── settings.html
│   ├── employee.html
│   └── payslip.html
├── css/
│   └── style.css
├── js/
│   ├── storage.js
│   ├── auth.js
│   ├── employees.js
│   ├── attendance.js
│   ├── leave.js
│   └── helper.js
└── README.md
```

Keep code organized and readable. Reuse common functions rather than
duplicating logic. Do not create extra pages beyond the seven required
pages.

## Architecture and Data Flow

Implement this flow:

**Admin / Employee → HTML pages and forms → vanilla JavaScript modules →
shared storage helpers → localStorage → pages recalculate and render
saved data**

-   `auth.js`: first-run setup, login, logout, password change, session
    and role checks.
-   `storage.js`: shared localStorage read/write helpers for the
    required keys.
-   `employees.js`: employee CRUD, search, department filtering, and
    employee login creation.
-   `attendance.js`: check-in, check-out, daily status, work-hour
    calculations, and attendance queries.
-   `leave.js`: leave application, working-day calculation,
    overlap/quota validation, approval/rejection, comments, and
    balances.
-   `helper.js`: role-aware keyword matching and answers from saved
    records.
-   Page scripts should call these modules and render current data; they
    should not maintain separate fake totals.

## UI Requirements

-   Apply HireSpera branding and the dark navy / purple-blue visual
    theme consistently.
-   Use clear navigation appropriate to the user's role.
-   Use readable cards, tables, labels, forms, status indicators, and
    field-level validation messages.
-   Keep layouts responsive on desktop and mobile.
-   Use status colors consistently: green for present/approved, amber
    for late/pending, red for absent/rejected, and neutral colors for
    ordinary information.
-   Prioritize clarity and working functionality over decorative
    effects.
-   Do not add a theme switcher or other bonus UI.

## Build Order

Implement in this order: 1. First-run setup, login, logout, role
protection, and storage helpers. 2. Employee management and employee
login creation. 3. Company settings. 4. Attendance check-in/check-out
and attendance status. 5. Leave application, validation, Admin
approval/rejection, and balance. 6. Admin and Employee dashboards using
real saved data. 7. Payslip calculations and print/save as PDF. 8. Smart
Helper with role-restricted answers. 9. Responsive styling, validation
checks, README, and final testing.

## Acceptance Checklist

Before considering the app complete, verify:

-   [ ] Exactly seven required pages exist.
-   [ ] First-run setup creates company and Admin account; initial app
    data is empty.
-   [ ] Login, logout, password change, and role-based redirects work.
-   [ ] Admin adding an employee creates that employee's login.
-   [ ] Employee CRUD, search, and department filter work.
-   [ ] Attendance rules use Admin settings and prevent duplicate
    check-in.
-   [ ] Missing attendance on working days is treated as absent.
-   [ ] Leave dates, working-day count, overlap, and yearly quota are
    validated.
-   [ ] Admin can approve/reject leave with a comment.
-   [ ] Leave balance reflects approved leave.
-   [ ] Payslip follows only the specified formulas and can be
    printed/saved as PDF.
-   [ ] Smart Helper answers from real data and respects role privacy.
-   [ ] All dashboard figures are derived from stored app actions, not
    hardcoded demo data.
-   [ ] App is responsive and forms show errors beside fields.
-   [ ] No bonus features or unrequested functionality have been added.
-   [ ] README explains how to use the app.
-   [ ] GitHub repository and hosted link are ready for LMS submission.

## Submission

Prepare: 1. GitHub repository link. 2. Live hosted link (GitHub Pages,
Netlify, or Vercel). 3. README with setup and usage instructions.

## Final Instruction

Build **HireSpera** as the assignment-defined HCM Lite app. Treat this
file and the supplied assignment PDF as the source of truth. If
something is not required by the PDF or this architecture, do not add
it. Do not silently expand scope. Focus on correct business rules, role
privacy, real localStorage data, clean code, responsive UI, and a
complete working demo.
