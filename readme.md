# GTA (Goa Testing Agency) - Full-Stack Exam Management Platform

GTA (Goa Testing Agency) is a robust, full-stack, secure online exam creation and participation web application. It is designed to let instructors/professors create, configure, and monitor exams in real time, while providing students a seamless and secure environment to take exams under proctored conditions.

---

## 🚀 Key Features

### 🔑 1. Authentication & Security
- **Multi-Role User Accounts**: Separate access portals and layouts for **Students** and **Professors** (`ProtectedRoute` route guards).
- **Google OAuth Integration**: Simple, passwordless sign-in option using Google Login.
- **Standard Registration**: Quick and direct account registration for seamless signup.
- **Dual-Token JWT Auth**: Secure authentication flow using an short-lived `AccessToken` and a long-lived `RefreshToken` stored securely to automatically refresh sessions during long exams.

### 📝 2. Exam Creation & Configuration (Professor)
- **Interactive Exam Creator**: Form builder interface to define titles, descriptions, scheduling, and durations.
- **Multiple Question Formats**:
  - **MCQ (Multiple Choice Questions)**: Supports defining between 2 to 5 options per question.
  - **NAT (Numerical Answer Type)**: Supports precise numerical entry fields.
- **Question-Specific Media**: Professors can upload supporting images for any question (handled via Multer and cloud/local file storage).
- **Flexible Marking Schemes**: Set specific values per question for:
  - Positive Marks (correct answers)
  - Negative Marks (incorrect answers)
  - Unattempted Marks (skipped answers)
- **Automatic Score Evaluation**: Exam results are computed automatically on the backend immediately upon submission.

### ✨ 3. AI-Powered Quiz Generator
- **Gemini AI Integration**: Instructors can generate quizzes instantly by entering a text prompt (e.g. *"Newton's Laws of Motion for 5th grade"*).
- **Fine-Grained AI Prompts**:
  - Set specific number of total questions.
  - Balance ratios of MCQs vs. Numerical (NAT) questions.
  - Adjust difficulty levels (Easy, Medium, Hard).
  - Customize the options count per MCQ.
- **Draft Redirection**: Generated quizzes are directly forwarded to the standard Exam Builder form for final review, modification, and scheduling.

### 🔒 4. Exam Security & Proctoring (Student)
- **Tab Switching Warnings**: Detects and tracks tab switching and minimizing events in real time.
- **Anti-Cheat Enforcement**:
  - Warning system alerts the student on their 1st and 3rd tab-switches.
  - Automatically submits the exam immediately upon the 6th tab-switch.
- **Navigation Lockout**: Prevents students from exiting the exam page accidentally via browser page refreshes or navigation actions (`beforeunload` check and `popstate` browser history interception).
- **Auto-Submission Timer**: A precise countdown timer automatically submits the student's exam when time runs out.

### 🌐 5. IP Address Restrictions
- **Wi-Fi / LAN Locking**: Limit exams to a specific network location to prevent students from joining remotely or cheating from outside the exam room.
- **Automatic IP Detection**: In-app tool detects the professor's current public IP to restrict the exam with one click.
- **Access Verification**: Students are checked against the restricted IP before joining or opening the exam.

### 🖥️ 6. Live Session Monitoring & Management
- **Real-Time Proctoring Dashboard**: Shows a list of all students currently taking the exam.
- **Live Status Badges**: Tracks whether a student's session is currently `live` (active in the exam room) or `submitted`.
- **Administrative Session Control**:
  - **Kill Session**: Force-submits a student's live exam session instantly from the dashboard.
  - **Drop Session**: Administrative override to drop or reset status.

### 📊 7. Exam Analytics & Reporting
- **Interactive Performance Charts**: Marks distribution is charted dynamically using Recharts.
- **Statistical Analytics**: Calculations for Class Average (Mean), Median, and Highest Score.
- **Leaderboards**: Full ranked summary of student ranks, names, emails, and final scores.
- **PDF Report Downloads**: Generate and download print-ready PDF reports of the exam's performance dashboard.
- **Automated Score Mailer**: Nodemailer emails a detailed scorecard showing marks and totals to the student immediately after submission.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), React Router DOM, Recharts, Axios, React Hot Toast, React Icons
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT, bcryptjs, Multer
- **Integrations**: Gemini AI (Google Gen AI), Nodemailer
- **Styling**: Vanilla CSS, Flexbox, CSS Variables

---

## 📁 Project Directory Layout

```text
/GTA
├── /backend                    # Express API server
│   ├── /controllers            # Request handlers (User, Prof, Student)
│   ├── /DB                     # Database connections & Mongoose models
│   │   └── /models             # Schemas (User, Exam, ExamResponses)
│   ├── /middlewares            # JWT auth guards, file upload filters
│   ├── /routes                 # REST API Router declarations
│   ├── /utils                  # Email senders, IP helpers, error wrappers
│   └── app.js                  # Entry point
│
└── /frontend                   # React SPA
    ├── /src
    │   ├── /api                # Axios client configurations
    │   ├── /components         # Shared layout components (Protected routes, Loaders)
    │   ├── /context            # Auth session providers
    │   ├── /pages              # Sectioned layouts & screens
    │   │   ├── /LoginAndRegisterPages
    │   │   ├── /MyAccountPage
    │   │   ├── /StudentDashboard
    │   │   │   ├── /ExamPage
    │   │   │   └── /StudentReports
    │   │   └── /TeacherDashboard
    │   │       ├── /SetExam
    │   │       ├── /TeacherReports
    │   │       └── /AIQuizPrompt
    │   └── App.jsx             # Routes declaration
    └── index.html
```

---

## 🗄️ Database Schema & Data Models

### 👤 User Model (`userModel.js`)
- `name`, `email` (unique), `password` (hashed with bcrypt).
- `role` (enum: `student` / `professor`).
- `history`: Timeline logs of user actions (e.g., *"Joined exam X at 10:00 AM"*).
- `exams`: Array of exam references created (if professor).
- `responses`: Array of completed exam response references (if student).
- `isVerified`: Account status indicator (defaults to `true`).

### 📝 Exam Model (`ExamModel.js`)
- `professor`: Reference link to the creator.
- `title`, `description`, `code` (unique pin code to enter), `password`.
- `questions`: Sub-document array:
  - `question` (text), `type` (MCQ / NAT)
  - `options` (array of string choices for MCQ)
  - `correctAnswer` (string)
  - `marks`, `negativeMarks`, `unattemptedMarks`
  - `imageUrl`, `imagePublicId` (supporting media)
- `scheduledAt`, `closeAt` (UTC Date restrictions).
- `duration` (in minutes).
- `ipRestriction` (boolean), `allowedIp` (string validation).

### ✍️ Exam Responses Model (`ExamResponses.js`)
- `exam`: Reference link to the exam.
- `student`: Reference link to the student.
- `status` (enum: `live` / `submitted`).
- `answers`: Array of answers submitted:
  - `questionId` (string link)
  - `selectedAnswer` (string answer value)
- `startTime`, `score` (computed marks).
- `attemptedAt` (timestamp).