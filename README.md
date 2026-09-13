# EngiFlow AI: AI-Native Engineering Workflow & Predictive Delivery Platform

> **"From Requirement to Delivery — Tracked, Verified, Predicted."**

EngiFlow AI is an enterprise-grade, AI-native engineering workflow and predictive delivery platform purpose-built for complex hardware and systems engineering organizations (RF, Microwave, Antenna, Electronics, and Aerospace Systems). The platform unifies deterministic stage-gate workflow management, explainable machine learning delivery forecasting, dynamic requirement impact analysis, document intelligence (RAG), and interactive dependency knowledge graphs.

---

## 🏛️ Executive Summary & Design Architecture

### 1. Embedded AI in Systems Engineering
In complex multi-disciplinary engineering projects, technical data is fragmented across customer specifications, 3D electromagnetic (EM) simulation reports, supplier lead-time matrices, component datasheets, and qualification test logs. EngiFlow AI embeds artificial intelligence directly into the operational pipeline—continuously verifying requirement compliance, modeling change propagation across downstream engineering artifacts, extracting spec evidence, and identifying critical path bottlenecks before delays manifest.

### 2. Python-Powered Deterministic Foundation
EngiFlow AI leverages Python as its core engine for deterministic calculation, graph analytics, and numerical modeling:
- **Deterministic State Machine**: Enforces formal department handoff rules, legal state transitions, and approval prerequisites.
- **Weighted Progress Analytics**: Calculates exact overall project completion based on department-weighted contributions.
- **NetworkX Graph Analytics**: Evaluates directed acyclic dependency graphs (DAGs) to identify critical path tasks and bottleneck stages.
- **Explainable ML Regression**: Computes quantitative schedule completion forecasts and delay risk factors using historical engineering parameters.
- **Document Vector Retrieval**: Extracts text, chunks technical specifications, and performs vector search with exact evidence citations.

### 3. Machine Learning vs. LLM Responsibility Boundary
EngiFlow AI maintains a strict architectural separation between quantitative forecasting and generative language intelligence:
- **Quantitative Forecasting (ML Regression)**: Delivers deterministic, reproducible date forecasts, confidence intervals, and feature importance rankings based on historical project metrics (procurement lead times, simulation rework cycles, design revision counts, and department workload).
- **Document Intelligence (LLM / RAG)**: Synthesizes technical documentation, extracts specification evidence, and assists human engineering leads with findings analysis.

### 4. Preserving Human Engineering Oversight
EngiFlow AI enforces a **Human-in-the-Loop** control model. AI agents act exclusively in an advisory capacity—evaluating technical evidence against requirements and suggesting verdicts (`SUGGEST_APPROVE` vs `CAUTION_REJECT`). **Human engineering leads retain exclusive, non-delegable authority** to sign off on stage transitions, approve design revisions, or trigger rework.

---

## 🏗️ System Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ENGIFLOW AI ARCHITECTURE                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
     WORKFLOW ENGINE               AI ENGINE                  ML ENGINE
  ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
  │ State Machine    │       │ RAG Vector QA    │       │ ETA Prediction   │
  │ Weighted Progress│       │ Evidence Check   │       │ Delay Risk Model │
  │ Critical Path    │       │ Impact Agent     │       │ What-If Simulator│
  └─────────┬────────┘       └─────────┬────────┘       └─────────┬────────┘
            └──────────────────────────┼──────────────────────────┘
                                       ▼
                            ENGINEERING INTELLIGENCE
                                       ▼
                           HUMAN ENGINEERING JUDGEMENT
                                       ▼
                                    DELIVERY
```

| Layer | Technologies |
| :--- | :--- |
| **Backend Engine** | Python 3.14, FastAPI, SQLAlchemy 2.0, Pydantic v2, NetworkX, Scikit-Learn, Pandas, NumPy, Uvicorn |
| **Frontend Platform** | React 18, TypeScript, Vite, Material UI (Dark Aerospace Theme), Recharts, Lucide Icons |
| **Data Architecture** | Relational Database (SQLite / PostgreSQL) with relational seed schemas |

---

## 📊 Core Platform Modules & Feature Overview

### 1. Executive Control Dashboard
- **Progress Tracking**: Real-time project completion calculated from department-weighted progress.
- **Predictive Completion & Risk KPIs**: AI-forecasted completion dates, confidence intervals, schedule risk classifications (`HIGH`, `MEDIUM`, `LOW`), and active bottleneck alerts.
- **Analytical Metrics**: Recharts visualizations for **Department Completion (%)** and **Baseline vs. Actual Duration (Days)**.
- **Risk Driver Breakdown**: Explains key drivers contributing to schedule variance (e.g. procurement lead times, simulation rework iterations).
- **Audit Log**: Immutable timeline logging all stage submissions, approval reviews, rejections, and specification updates.

### 2. Department Workflow & Approval Gate
- **10-Stage Department Pipeline**: Tracks stage handoffs across:
  *Requirements Engineering* → *System Architecture* → *RF/Microwave Design* → *Ansys HFSS Simulation* → *Mechanical Chassis CAD* → *Design Review* → *Component Procurement* → *PCB Fabrication* → *Anechoic Chamber Testing* → *Qualification & Delivery*.
- **AI Review Agent**: Pre-evaluates technical evidence against requirement baselines before human review.
- **Human Approval Gate**: Interface for engineering leads to inspect technical evidence, review advisory verdicts, and execute stage transitions.

### 3. Requirements Engineering & Impact Simulator
- **Verification Matrix**: Monitors compliance status (`VERIFIED`, `UNVERIFIED`, `FAILED`) across all technical requirements.
- **Requirement Change Impact Engine**: Evaluates the downstream ripple effect of specification changes (e.g. target gain revision from ≥ 12.0 dBi to ≥ 15.0 dBi), identifying affected critical path artifacts.
- **Design Rework Simulation**: Generates automated revision iterations (e.g. `V2` horn flare expansion) and HFSS re-evaluations to re-verify compliance.

### 4. Interactive Timeline & Critical Path Gantt
- **Dynamic Gantt Schedule**: Displays project timeline across all engineering departments.
- **Critical Path Highlighting**: Visualizes bottleneck tasks directly on the critical path.
- **Baseline vs. Forecast Overlay**: Displays planned schedule baselines alongside real-time ML forecast dates.

### 5. What-If Schedule Simulator
- **Parameter Adjustment Sliders**: Simulates environmental variables (supplier lead-time variances, engineering headcount modifications).
- **Real-Time ML Sandbox**: Runs predictive models in an isolated sandbox to visualize completion date shifts.

### 6. Engineering Document Intelligence (RAG)
- **Technical Specification Search**: Natural language query engine over technical specifications, datasheets, and test reports.
- **Verifiable Evidence Citations**: Extracts verbatim textual quotes with document citations (`DOC-014`, `DOC-008`) to ensure auditability.

### 7. Dependency Analytics & Knowledge Graph
- **Entity Dependency Network**: Visualizes entities (Requirements, CAD Models, HFSS Simulations, Purchase Orders, Test Logs) as a directed graph.
- **Impact Drilldown**: Interactive node selections highlight upstream dependencies and downstream impact targets.

---

## ⚡ Setup & Execution Guide

### 1. Prerequisites
- **Python**: v3.10 or higher
- **Node.js**: v18 or higher & `npm`

### 2. Backend Installation & Execution
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1   # On Windows PowerShell
# source venv/bin/activate    # On Linux / macOS

# Install dependencies
pip install fastapi uvicorn sqlalchemy pydantic scikit-learn pandas numpy networkx httpx python-multipart

# Initialize database schema and seed data
$env:PYTHONPATH="."
python -m app.seed.seed_db

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
> **API Documentation**: OpenAPI / Swagger docs are available at `http://localhost:8000/docs`

### 3. Frontend Installation & Execution
```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev
```
> **Web Interface**: Platform UI is accessible at `http://localhost:5173`

---

## 📁 Repository Structure

```
Workflow_System/
├── backend/
│   ├── app/
│   │   ├── ai/               # RAG Document QA Engine & Vector Extractors
│   │   ├── api/              # FastAPI Router Controllers & Endpoint Schemas
│   │   ├── core/             # Application Configuration & Database Session
│   │   ├── database/         # Database Connections & Models
│   │   ├── models/           # SQLAlchemy Data Schema Definitions
│   │   ├── schemas/          # Pydantic Data Transfer Objects (DTOs)
│   │   ├── seed/             # Database Seeding Script (`seed_db.py`)
│   │   └── services/         # State Machine, ML Predictor & Impact Engine
│   └── main.py               # FastAPI Application Entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/       # Dashboard Tab Views & Visual Components
│   │   ├── services/         # API Service Layer & HTTP Client
│   │   ├── types/            # TypeScript Interface & Enum Definitions
│   │   └── App.tsx           # React Application Root & Router
│   ├── package.json          # Node Dependencies & Build Scripts
│   └── vite.config.ts        # Vite Bundler Configuration
└── README.md                 # Technical README Specification
```

---

## 🔌 REST API Specification

| Module | Method | Path | Description |
| :--- | :--- | :--- | :--- |
| **Projects** | `GET` | `/api/projects` | List all active projects with progress metrics & AI delivery forecasts |
| **Projects** | `GET` | `/api/projects/{id}` | Retrieve comprehensive project detail by ID |
| **Projects** | `POST` | `/api/projects` | Initialize a new engineering project |
| **Workflow** | `GET` | `/api/workflow/{project_id}` | Retrieve active department workflow stages and handoff statuses |
| **Workflow** | `POST` | `/api/workflow/{stage_id}/approve` | Approve stage handoff with human review and evidence verification |
| **Requirements** | `GET` | `/api/requirements/{project_id}` | Retrieve requirement traceability matrix and compliance status |
| **Requirements** | `POST` | `/api/requirements/simulate-impact` | Simulate requirement specification change impacts across downstream artifacts |
| **Predictions** | `GET` | `/api/predictions/{project_id}` | Retrieve ML completion date forecasts, delay risks, and critical path bottlenecks |
| **Predictions** | `POST` | `/api/predictions/what-if` | Execute What-If delivery schedule simulation with modified parameters |
| **Document RAG** | `POST` | `/api/rag/query` | Perform vector search over technical specifications with evidence citations |
| **Knowledge Graph**| `GET` | `/api/graph/{project_id}` | Retrieve directed entity dependency graph nodes and edges |
