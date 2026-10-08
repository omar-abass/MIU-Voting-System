<div align="center">

# 🗳️ MIU Voting System

### Online Voting System for Misr International University

<br>

**A secure and organized web-based voting platform designed for university elections and voting events.**

<br>

![Status](https://img.shields.io/badge/Status-In%20Development-orange)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![Backend](https://img.shields.io/badge/Backend-PHP-777BB4)
![Database](https://img.shields.io/badge/Database-MySQL-4479A1)

</div>

---

## 📌 About The Project

**MIU Voting System** is a web-based online voting platform designed for **Misr International University (MIU)**.

The system aims to provide a simple, organized, and secure way to conduct university elections and voting events digitally.

Instead of relying on traditional paper-based voting, eligible students will be able to access elections online, review candidates or available options, cast their votes, and view published results after the election has ended.

Administrators will have dedicated tools to create and manage elections, manage eligible voters, monitor voting activity, and publish results.

> 🚧 **Project Status:** This project is currently in the **design and development phase**. Some features and interfaces are planned but have not been implemented yet.

---

## 🎯 Project Objectives

The main objectives of the MIU Voting System are to:

- Provide an online platform for university elections.
- Simplify the voting process for students.
- Reduce the need for manual voting procedures.
- Allow administrators to efficiently manage elections.
- Prevent duplicate or unauthorized voting.
- Provide organized election results.
- Apply authentication and authorization concepts.
- Demonstrate practical web development and database design skills.

---

# ✨ Planned Features

## 👨‍💼 Admin Features

The Admin section is planned to provide the following functionality:

### 🗳️ Election Management

- Create new elections.
- Configure election details.
- Set election start and end dates.
- Add and manage candidates.
- Edit election information.
- Close elections.

### 👥 Voter Management

- Add eligible voters.
- Verify voter eligibility.
- View registered voters.
- Manage voter status.
- Remove or deactivate voters when necessary.

### 📊 Voting Monitoring

Administrators will be able to monitor the progress of an active election.

Example information:

```text
Total Eligible Voters
Votes Cast
Remaining Voters
Participation Rate
```

### 📈 Results Management

- Calculate election results.
- View voting statistics.
- Review candidate vote counts.
- Publish results after the election closes.

---

# 👨‍🎓 Voter Features

Eligible students are planned to have access to:

### 📝 Registration

Students can create a voting account using their required information.

### 🔐 Authentication

Users will be able to securely log in to their accounts.

### 🗳️ View Elections

Voters can view elections that they are eligible to participate in.

### 👤 View Candidates

Voters can review candidate information before casting their vote.

### ✅ Cast Vote

Voters can select their preferred candidate or option and submit their vote.

### 🔒 Vote Protection

The system will prevent a voter from submitting more than one vote for the same election.

### ✔️ Vote Confirmation

After successfully submitting a vote, the system will provide confirmation that the vote has been recorded.

### 📊 View Results

Published election results will become available to voters after the election has closed and the results have been published.

---

# 🔐 Security Considerations

Security is an important part of the system design.

The project is planned to include mechanisms for:

- User authentication.
- Role-based authorization.
- Voter eligibility verification.
- Password protection.
- Prevention of duplicate voting.
- Protection of admin-only functionality.
- Prevention of voting after an election closes.
- Server-side validation.
- Secure database operations.
- Protection of sensitive user information.

### Authentication vs Authorization

**Authentication** answers:

> "Who are you?"

For example:

```text
Email + Password
        ↓
    User Identity
```

**Authorization** answers:

> "What are you allowed to do?"

For example:

```text
Voter
 ├── View Elections
 ├── View Candidates
 ├── Cast Vote
 └── View Published Results

Admin
 ├── Create Elections
 ├── Manage Voters
 ├── Manage Candidates
 ├── Monitor Voting
 └── Manage Results
```

---

# 🛠️ Technology Stack

## Frontend

- **React**
- **Vite**
- **JavaScript**
- **HTML5**
- **CSS3**

## Backend

- **PHP**
- **REST API**

## Database

- **MySQL**

## Development Tools

- **Git**
- **GitHub**
- **Visual Studio Code**

---

# 🏗️ System Architecture

The system follows a client-server architecture.

```text
┌─────────────────────────────┐
│                             │
│       React Frontend        │
│          + Vite             │
│                             │
│  ┌────────┐  ┌──────────┐  │
│  │ Voter  │  │  Admin   │  │
│  │ Pages  │  │  Pages   │  │
│  └────────┘  └──────────┘  │
│                             │
└──────────────┬──────────────┘
               │
               │ HTTP / API Requests
               ▼
┌─────────────────────────────┐
│                             │
│          PHP API            │
│                             │
│  ┌────────┐ ┌────────────┐ │
│  │ Routes │ │ Controllers│ │
│  └────────┘ └────────────┘ │
│                             │
│  ┌────────┐ ┌────────────┐ │
│  │ Models │ │ Middleware │ │
│  └────────┘ └────────────┘ │
│                             │
└──────────────┬──────────────┘
               │
               │ Database Queries
               ▼
┌─────────────────────────────┐
│                             │
│          MySQL              │
│                             │
│  ┌───────┐ ┌─────────────┐ │
│  │ Users │ │ Elections   │ │
│  └───────┘ └─────────────┘ │
│                             │
│  ┌────────────┐ ┌────────┐ │
│  │ Candidates │ │ Votes  │ │
│  └────────────┘ └────────┘ │
│                             │
└─────────────────────────────┘
```

### Architecture Flow

```text
React
  │
  │ API Request
  ▼
PHP Backend
  │
  │ SQL Query
  ▼
MySQL
  │
  │ Response
  ▼
PHP Backend
  │
  │ API Response
  ▼
React
```

---

# 🗄️ Database Overview

The database is planned to contain the main entities required for the voting system.

### Users

Stores information about system users.

```text
Users
├── id
├── name
├── email
├── password
├── role
└── status
```

### Elections

Stores information about voting events.

```text
Elections
├── id
├── title
├── description
├── start_date
├── end_date
└── status
```

### Candidates

Stores candidates associated with elections.

```text
Candidates
├── id
├── election_id
├── name
└── description
```

### Votes

Stores submitted voting records.

```text
Votes
├── id
├── user_id
├── election_id
├── candidate_id
└── created_at
```

### Basic Relationship

```text
Users
  │
  │
  └──────────────┐
                 │
                 ▼
               Votes
                 │
          ┌──────┴──────┐
          │             │
          ▼             ▼
      Elections     Candidates
```

> The final database structure may be updated during the development process based on the project's requirements.

---

# 📁 Planned Project Structure

The project is planned to follow a separated frontend/backend structure:

```text
MIU-Voting-System/
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── voter/
│   │   │   └── admin/
│   │   ├── services/
│   │   ├── context/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   │
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── database/
│   └── index.php
│
└── README.md
```

> The project structure may evolve as development progresses.

---

# 🔄 System Workflow

The expected workflow of the system is:

```text
                    MIU VOTING SYSTEM
                           │
             ┌─────────────┴─────────────┐
             │                           │
           ADMIN                       VOTER
             │                           │
             ▼                           ▼
      Create Election                 Register
             │                           │
             ▼                           ▼
      Add Candidates                    Login
             │                           │
             ▼                           ▼
       Manage Voters             View Elections
             │                           │
             ▼                           ▼
      Monitor Voting             View Candidates
             │                           │
             ▼                           ▼
       Generate Results              Cast Vote
             │                           │
             ▼                           ▼
       Publish Results           Vote Confirmation
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
                    Published Results
```

---

# 🚀 Development Plan

The project development is expected to follow these stages:

### Phase 1 — Planning & Design

- Define system requirements.
- Design the system architecture.
- Design the database.
- Design user roles and permissions.
- Design the website UI/UX.

### Phase 2 — Backend Development

- Set up PHP backend.
- Connect PHP to MySQL.
- Implement authentication.
- Implement user management.
- Implement election management.
- Implement voting functionality.
- Implement results management.

### Phase 3 — Frontend Development

- Set up React + Vite.
- Build authentication pages.
- Build voter dashboard.
- Build admin dashboard.
- Build election pages.
- Build voting interface.
- Build results pages.

### Phase 4 — Integration

- Connect React frontend with PHP APIs.
- Integrate authentication.
- Integrate voting functionality.
- Integrate database operations.

### Phase 5 — Testing

- Test authentication.
- Test authorization.
- Test election management.
- Test voting restrictions.
- Test duplicate voting prevention.
- Test results calculation.
- Test API and database interactions.

### Phase 6 — Finalization

- UI improvements.
- Security improvements.
- Bug fixing.
- Documentation.
- Final testing.

---

# 👥 Team Members

This project is developed by a team of five students.

| Member | GitHub |
|---|---|
| **Omar Mohamed Abass** | [@omar-abass](https://github.com/omar-abass) |
| **Ahmed Abd El Nasser** | [@ahmed-nasser104](https://github.com/ahmed-nasser104) |
| **Mazen** | [@mazen2406160](https://github.com/mazen2406160) |
| **Youssef** | [@youssef2400237-create](https://github.com/youssef2400237-create) |
| **Mohamad Ashraff** | [@m0hamad-ashraff](https://github.com/m0hamad-ashraff) |

---

# 🎓 Academic Project

**MIU Voting System** is developed as an academic project for **Misr International University (MIU)**.

The project is intended to demonstrate practical knowledge and application of:

- Web Development
- Frontend Development
- Backend Development
- Database Design
- REST APIs
- Authentication
- Authorization
- CRUD Operations
- Web Security
- Client-Server Architecture
- Git & GitHub
- Software Engineering Principles

---

# ⚠️ Disclaimer

This project is developed for **educational and academic purposes**.

It is not intended to be used for official governmental elections, legally binding elections, or real-world high-stakes voting without significant additional security auditing, testing, and compliance requirements.

---

<div align="center">

### 🗳️ MIU Voting System

**Designed and developed for Misr International University**

</div>
