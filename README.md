# KIZUNA
### AI-Powered Automatic Block Planning for Maximizing Asset Availability in Railway Operations


---

## 1. Overview

**KIZUNA** is an intelligent railway maintenance and block-planning platform designed to coordinate maintenance activities with train operations.

In conventional railway operations, maintenance requests may originate independently from different departments such as Track, Signal, Electrical, and Engineering. When these activities are planned independently, overlapping work requirements can result in repeated traffic blocks, operational disruption, under-utilization of maintenance windows, conflicts with train movements, and difficulty in prioritizing critical work.

KIZUNA addresses this challenge by transforming independent maintenance requirements into a coordinated, data-driven planning process.

The platform combines:

- Maintenance task management
- Defect intelligence
- Train timetable analysis
- Section occupancy analysis
- Priority scoring
- ML-based maintenance risk intelligence
- Conflict detection
- Automated block planning
- Constraint-based optimization
- Daily, weekly, and monthly planning

The objective is to maximize **asset availability while minimizing operational disruption**.

---

## 2. Problem Statement

Railway maintenance activities are highly dependent on the availability of track sections and operational windows.

A maintenance activity may be technically feasible but operationally difficult if:

- Multiple trains occupy the section during the requested period.
- Another department requires the same section.
- The available maintenance window is too short.
- The task has a high operational impact.
- Critical maintenance work is competing with lower-impact activities.

Traditional planning approaches often treat these requests as isolated activities.

KIZUNA introduces a coordinated planning layer that considers **maintenance requirements and train operations together**.

---

## 3. Proposed Solution

KIZUNA follows a unified planning pipeline:

```text
TMS / SMMS / TDMS
        |
        v
Data Normalization
        |
        v
Railway Operational Database
        |
        +-- Maintenance Tasks
        +-- Defects
        +-- Train Timetable
        +-- Train Stops
        +-- Corridor Availability
        |
        v
Priority & Risk Intelligence
        |
        v
Train Impact Analysis
        |
        v
Conflict Detection
        |
        v
Joint Block Builder
        |
        v
CP-SAT Optimization
        |
        v
Daily / Weekly / Monthly Plans
        |
        v
KIZUNA Dashboard
```

The system moves from **individual maintenance requests** to **coordinated operational blocks**.

---

## 4. Key Capabilities

### 4.1 Maintenance Management

Maintenance teams can create, monitor, update, and manage maintenance activities.

Each task can contain:

- Maintenance title
- Description
- Railway section
- Department
- Criticality
- Severity
- Urgency
- Duration
- Status
- Planned date

### 4.2 Defect Management

KIZUNA integrates railway defect information from operational sources.

Defects are associated with:

- Asset
- Asset type
- Railway section
- Source system
- Severity
- Criticality
- Reporting time
- Due date
- Status

### 4.3 Priority Intelligence

KIZUNA calculates maintenance priority using multiple operational factors:

- Criticality
- Severity
- Urgency
- Train impact
- Failure risk
- Overdue risk
- Traffic density
- Maintenance-window scarcity
- Duration impact

The resulting score is translated into:

```text
Critical
High
Medium
Low
```

The contributing factors are exposed to make the prioritization explainable rather than a black-box score.

---

## 5. ML-Based Maintenance Risk Intelligence

KIZUNA includes a separate ML layer for maintenance risk intelligence.

The current implementation uses **unsupervised anomaly detection** because the available railway dataset does not contain sufficient historical failure labels for reliable supervised failure prediction.

The ML layer uses operational characteristics such as:

- Maintenance criticality
- Severity
- Urgency
- Train impact
- Overdue duration
- Task duration
- Operational characteristics

The system generates:

- ML risk score
- Risk level
- Model confidence
- Anomaly indication
- ML model information

### Why anomaly detection?

The available maintenance dataset does not provide reliable historical labels such as:

```text
Task -> Failure occurred / Failure did not occur
```

Training a supervised failure model without reliable labels can produce misleading results.

KIZUNA therefore uses ML as a **risk intelligence and anomaly-detection layer**, while keeping the operational priority engine explainable.

---

## 6. Train Impact Analysis

KIZUNA analyzes train movement data to determine how many trains are affected by a maintenance section.

The system uses:

- Train master data
- Train stop sequences
- Arrival times
- Departure times
- Section transitions

For each requested railway section, KIZUNA identifies trains occupying that section and calculates the associated operational impact.

This information is used by both the priority and planning layers.

---

## 7. Maintenance Window Intelligence

Maintenance windows are analyzed against train occupancy.

The system identifies available periods between train movements and evaluates whether maintenance activities can fit within those windows.

Window availability influences operational priority and block planning.

This allows KIZUNA to answer:

> **When can this maintenance activity be executed with minimum operational disruption?**

---

## 8. Conflict Detection

Before planning a maintenance task, KIZUNA can identify operational conflicts.

Potential conflicts include:

- Train movement conflicts
- Overlapping maintenance activities
- Section conflicts
- Insufficient maintenance windows
- Operationally constrained periods

This helps planners identify conflicts before execution.

---

## 9. Joint Block Planning

One of KIZUNA's core concepts is **joint block planning**.

Instead of treating maintenance activities independently:

```text
Task A -> Block
Task B -> Block
Task C -> Block
```

KIZUNA identifies activities that can potentially be coordinated:

```text
Task A --+
Task B --+--> Joint Operational Block
Task C --+
```

This enables multiple compatible activities to be performed within a coordinated maintenance window.

The result is reduced repetition of traffic blocks and better utilization of available operational windows.

---

## 10. Constraint-Based Optimization

KIZUNA uses **Google OR-Tools CP-SAT** for constraint-based planning.

The optimization layer considers operational constraints such as:

- Maintenance duration
- Section availability
- Train occupancy
- Task conflicts
- Planning windows
- Task compatibility
- Operational priorities

The optimizer searches for feasible coordinated schedules rather than simply sorting maintenance tasks.

---

## 11. Planning Horizons

KIZUNA supports multiple planning horizons.

### Daily Planning
Used for immediate operational maintenance decisions.

### Weekly Planning
Used to coordinate maintenance activities across the upcoming operating week.

### Monthly Planning
Used for broader maintenance planning and resource visibility.

---

## 12. System Architecture

```text
                    +---------------------+
                    | Railway Data Sources|
                    | TMS / SMMS / TDMS   |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    | Data Normalization  |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    | PostgreSQL Database |
                    +----------+----------+
                               |
             +-----------------+-----------------+
             |                 |                 |
             v                 v                 v
       Maintenance          Defects          Train Data
             |                 |                 |
             +-----------------+-----------------+
                               |
                               v
                    +---------------------+
                    | Priority Engine     |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    | ML Risk Intelligence|
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    | Train Impact Engine |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    | Conflict Detection  |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    | Joint Block Builder |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    | CP-SAT Optimizer    |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    | Planning Engine      |
                    | Daily/Weekly/Monthly |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    | KIZUNA Dashboard    |
                    +---------------------+
```

---

## 13. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend | FastAPI |
| Language | Python |
| ORM | SQLAlchemy |
| Database | PostgreSQL |
| Optimization | Google OR-Tools CP-SAT |
| Authentication | JWT |
| Password Security | bcrypt |
| ML | Python-based anomaly/risk intelligence |
| Data | Railway operational CSV datasets |

---

## 14. Backend API

KIZUNA exposes REST APIs through FastAPI.

### Railway Data

```text
GET /api/trains/stations
GET /api/trains/trains
GET /api/trains/train-stops
```

### Maintenance

```text
GET    /api/maintenance
POST   /api/maintenance
GET    /api/maintenance/priorities
GET    /api/maintenance/{task_id}
PATCH  /api/maintenance/{task_id}
DELETE /api/maintenance/{task_id}
GET    /api/maintenance/{task_id}/conflicts
```

### Defects

```text
GET  /api/defects
GET  /api/defects/priorities
POST /api/defects
```

### Planning

```text
POST /api/optimizer/run
POST /api/planning/weekly
POST /api/planning/monthly
GET  /api/planning/tasks
```

### Scenario Analysis

```text
POST /api/scenario/simulate
```

### Administration

```text
POST   /api/admin/login
GET    /api/admin/me
GET    /api/admin/users
POST   /api/admin/users
DELETE /api/admin/users/{user_id}
GET    /api/admin/department-data
```

### Health

```text
GET /api/health
```

---

## 15. Dashboard Modules

### User Dashboard

- Dashboard
- Network Control
- Maintenance
- Predictive Maintenance
- Defects
- Train Movements
- Block Planning
- Optimization
- Plan History

### Admin Dashboard

- Overview
- Live Map
- Users
- Departments
- Railway Network
- Predictive Maintenance
- System Logs
- Data Management

---

## 16. Application Screens

Screenshots are organized under `screenshots/`.

Each screenshot is paired with a concise description so the README also serves as product documentation.

### 16.1 Login Page

**Purpose:** KIZUNA Login for User and Admin

![KIZUNA Home](screenshots/login.png)

### 16.2 User Dashboard

**Purpose:** Provides an operational overview of railway maintenance activities, planning status, and network information.

![User Dashboard](screenshots/user_dashboard.png)

### 16.3 Network Control

**Purpose:** Provides a visual representation of railway network sections and operational information required for maintenance planning.

![Network Control](screenshots/network_control.png)

### 16.4 Maintenance Management

**Purpose:** Allows users to monitor and manage maintenance tasks across railway sections.

Key information includes task, department, criticality, severity, urgency, duration, status, and planned date.

![Maintenance](screenshots/mtask_1.png)
![Maintenance](screenshots/mtask_2.png)

### 16.5 Predictive Maintenance

**Purpose:** Provides maintenance risk intelligence using the priority engine and ML-based anomaly detection.

The page highlights high-risk tasks, unusual patterns, overall risk, and task-level risk information.

![Predictive Maintenance](screenshots/pmain_3.png)
### 16.6 Maintenance Risk Review

**Purpose:** Provides a detailed view of an individual maintenance task, including risk summary, priority assessment, risk factors, operational impact, train impact, planning context, and maintenance information.

![Predictive Maintenance](screenshots/pmain_1.png)
![Predictive Maintenance](screenshots/pmain_2.png)

### 16.7 Defect Management

**Purpose:** Provides visibility into reported railway defects and their operational characteristics.

![Defects](screenshots/defects.png)

### 16.8 Train Movements

**Purpose:** Displays train movement and timetable information used for operational planning and train-impact analysis.

![Train Movements](screenshots/train_movements.png)

### 16.9 Block Planning

**Purpose:** Provides the planning interface for coordinating maintenance activities into operational blocks.

![Block Planning](screenshots/block_planning.png)

### 16.10 Optimization

**Purpose:** Runs constraint-based optimization to generate feasible maintenance plans while considering railway operational constraints.

![Optimization](screenshots/op_1.png)
![Optimization](screenshots/op_2.png)

### 16.11 Plan History

**Purpose:** Provides visibility into previously generated maintenance plans and planning history.

![Plan History](screenshots/pl_1.png)
![Plan History](screenshots/pl_2.png)
![Plan History](screenshots/pl_3.png)

---

## 17. Administration Interface

### 17.1 Admin Overview

**Purpose:** Provides administrators with a high-level view of system activity and operational planning.

![Admin Overview](screenshots/ad_overview.png)

### 17.2 Admin Predictive Maintenance

**Purpose:** Provides administrators with centralized visibility into maintenance risk intelligence across departments.

![Admin Predictive Maintenance](screenshots/pm_1.png)
![Admin Predictive Maintenance](screenshots/pm_2.png)

### 17.3 Department Management

**Purpose:** Provides department-level operational visibility and maintenance information.

![Admin Departments](screenshots/department_ad.png)
### 17.4 Railway Network

**Purpose:** Provides administrators with railway network and section-level information.

![Admin Network](screenshots/admin_nc.png)

### 17.5 User Management

**Purpose:** Allows administrators to manage platform users and access.

![Admin Users](screenshots/ad_um.png)

### 17.6 Data Management

**Purpose:** Provides access to operational railway datasets and data management functionality.

![Admin Data](screenshots/ad_dm.png)

### 17.7 System Logs / Status

**Purpose:** Provides system-level operational and service information for administrators.

![System Status](screenshots/admin_syschk.png)

---

## 18. Data Flow

```text
Raw Railway Data
      |
      v
Normalization
      |
      v
Database
      |
      +-- Maintenance
      +-- Defects
      +-- Trains
      +-- Train Stops
      |
      v
Operational Intelligence
      |
      +-- Priority
      +-- Risk
      +-- Train Impact
      +-- Window Availability
      |
      v
Optimization
      |
      v
Maintenance Plan
```

---

## 19. Explainability

KIZUNA separates three major intelligence layers:

### Explainable Operational Priority

The priority engine explicitly exposes the factors contributing to a task's score.

### ML Risk Intelligence

The ML layer identifies unusual operational patterns and provides additional risk information.

### Optimization

The CP-SAT layer evaluates operational constraints and generates feasible plans.

This separation makes the overall system easier to understand, validate, and demonstrate.

---

## 20. Security

KIZUNA includes role-based authentication mechanisms.

Security components include:

- JWT-based authentication
- Separate user and administrator access
- Password hashing using bcrypt
- Protected administrative APIs
- Token-based API authorization

---

## 21. Project Structure

```text
KIZUNA/
|
+-- frontend/
|   +-- src/
|       +-- App.jsx
|       +-- main.jsx
|       +-- DashboardLayout.jsx
|       +-- UserSidebar.jsx
|       +-- AdminSidebar.jsx
|       +-- Maintenance.jsx
|       +-- PredictiveMaintenance.jsx
|       +-- MaintenanceRiskReview.jsx
|       +-- BlockPlanning.jsx
|       +-- Optimization.jsx
|       +-- ...
|   +-- package.json
|
+-- backend/
|   +-- app/
|       +-- routers/
|       +-- services/
|       +-- models/
|       +-- schemas/
|       +-- main.py
|   +-- data/
|   +-- requirements.txt
|
+-- docs/
|   +-- screenshots/
|
+-- README.md
```

---

## 22. Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL
- Git

### Backend Setup

```bash
cd backend
python -m venv venv
```

Windows:

```bash
venv\Scriptsctivate
```

Linux / macOS:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the database connection using the project's environment configuration.

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will provide the frontend URL in the terminal.

---

## 23. API Proxy

During development, the frontend communicates with the FastAPI backend through the Vite API proxy.

```text
Frontend
   |
   | /api/*
   v
Vite Proxy
   |
   v
FastAPI
   |
   v
PostgreSQL
```

---

## 24. Prototype Dataset

The prototype uses railway operational datasets containing information such as:

- Stations
- Trains
- Train stops
- Railway sections
- Maintenance activities
- Defects

Current prototype network:

| Dataset | Records |
|---|---:|
| Stations | 7 |
| Trains | 42 |
| Train Stops | 188 |

These datasets are used to demonstrate train-impact analysis, maintenance-window analysis, and coordinated block planning.

---

## 25. Optimization Workflow

```text
Maintenance Requests
        |
        v
Priority Calculation
        |
        v
Risk Intelligence
        |
        v
Train Impact Analysis
        |
        v
Available Window Detection
        |
        v
Conflict Detection
        |
        v
Compatible Task Grouping
        |
        v
CP-SAT Optimization
        |
        v
Feasible Maintenance Plan
```

---

## 26. What Makes KIZUNA Different

KIZUNA is designed around the principle that railway maintenance should not be planned independently from railway operations.

Instead of:

```text
Maintenance Planning
        +
Train Operations
```

KIZUNA creates a coordinated planning layer:

```text
Maintenance
      +
Defects
      +
Train Operations
      +
Risk Intelligence
      +
Operational Windows
      +
Optimization
      |
      v
Coordinated Block Plan
```

This enables maintenance planning to become more operationally aware and explainable.

---

## 27. Future Scope

The prototype can be extended with:

- Real-time TMS/SMMS/TDMS integration
- Live railway telemetry
- Historical maintenance failure labels
- Supervised failure prediction
- Advanced resource allocation
- Crew and equipment constraints
- Real-time disruption handling
- Network-wide optimization
- Digital twin integration
- Continuous model monitoring
- Production-grade railway deployment

---

## 28. Project Objective

The ultimate objective of KIZUNA is to provide railway planners with a unified decision-support system that can answer:

> **What maintenance needs to be done, how important is it, what operational impact will it create, and when should compatible activities be executed together?**

By combining operational intelligence, ML-assisted risk analysis, and constraint-based optimization, KIZUNA provides a foundation for coordinated railway maintenance planning.

---

## 29. Team

**KIZUNA Team**

---

## License

This project is developed as a prototype.

