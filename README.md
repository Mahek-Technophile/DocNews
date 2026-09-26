# DOCNEWS — Document to Newsletter Converter

![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)
![Platform](https://img.shields.io/badge/Node.js-22%20LTS-green)
![Container](https://img.shields.io/badge/Docker-Alpine-cyan)
![Deployment](https://img.shields.io/badge/Deployment-Render-purple)
![Assessment](https://img.shields.io/badge/CCA%202-MIT--WPU-orange)

An automated document ingestion and newsletter generation platform built for the **Cloud Computing and DevOps (CSE30040)** Continuous Competency Assessment (CCA 2) at **MIT World Peace University, Pune**.

---

## 🎯 Assessment Deliverables & Rubric Compliance Matrix

| Criterion | Implementation & Evidence | Repository / Live Reference |
| :--- | :--- | :--- |
| **Working dynamic application** | Full-stack application with document parsing forms, active state mutations, interactive themes, and persistent API records. | 🔗 [Live Web Service](https://docnews.onrender.com) |
| **Form, data display, API and health routes work on the live URL** | Ingestion forms (`POST /api/convert`), live list (`GET /api/newsletters`), CRUD endpoints (`PUT`, `DELETE`), HTML/PDF export, and uptime probe returning active Git Commit ID. | 🔗 [Live Probe `/health`](https://docnews.onrender.com/health)<br>🔗 [API Reference](#4-api-endpoints) |
| **Git usage** | 10+ atomic commits with semantic commit conventions (`feat:`, `fix:`, `ci:`, `test:`, `refactor:`), feature branching, and merged Pull Requests. | 🔗 [Merged Pull Requests](https://github.com/Mahek-Technophile/DocNews/pulls?q=is%3Apr+is%3Aclosed)<br>🔗 [Branch History](https://github.com/Mahek-Technophile/DocNews/branches) |
| **Automated tests and lint** | Native Node.js test suite (`test/app.test.ts`) validating 5 mission-critical endpoints and payload schemas, with zero TypeScript/ESLint warnings. | 🔗 [Test Suite Source](test/app.test.ts)<br>🔗 [Test Stage Config](.github/workflows/ci-cd.yml#L20-L40) |
| **CI/CD pipeline** | Multi-stage GitHub Actions pipeline enforcing automated quality gates: linting, unit tests, Docker container building, smoke test, and Render deployment. | 🔗 [GitHub Actions Workflow](.github/workflows/ci-cd.yml)<br>🔗 [Workflow Runs](https://github.com/Mahek-Technophile/DocNews/actions) |
| **Failure demo** | Simulated failure on feature branch (`test/ci-failure-demo`) proving the CI quality gate halts the pipeline and skips container build/deployment before reaching production. | 🔗 [Failure Proof Section](#7-ci-barrier--failure-demo)<br>🔗 [Demo Workflow Run](https://github.com/Mahek-Technophile/DocNews/actions) |
| **Report and README** | Professional documentation featuring architecture diagrams, endpoint documentation, Docker setup instructions, and step-by-step reproduction guide. | 🔗 [Architecture & Flow](#2-cicd-architecture--pipeline-flow)<br>🔗 [Docker Guide](#6-docker-instructions) |

---

## 1. Project Overview

**DOCNEWS** transforms dense university notices, syllabus briefs, activity circulars, and departmental reports into structured, visually engaging newsletters.

### Key Capabilities
- **Multi-Format Ingestion:** Extracts text from Microsoft Word (`.docx` via `mammoth`), Markdown (`.md`), and raw text paste.
- **Deterministic Synthesis Engine:** Automatically extracts titles, headings, lead stories, and key bullet points using explainable, rule-based algorithms (zero flaky external AI dependencies).
- **Multiple Newsletter Themes:** Supports **Campus**, **Corporate**, **Modern**, and **Minimal** responsive typography styles.
- **Section & Highlight Editor:** Allows real-time authoring of headlines, stories, and summary bullets before publishing.
- **Dynamic Server-Side State:** Newsletters are generated, stored, edited, and queried through dynamic Express REST endpoints.
- **Export Formats:** Clean standalone HTML downloads and printer-ready CSS (`@media print`) layouts configured for direct PDF export.
- **DevOps Telemetry:** Includes a `/health` endpoint returning live service status and running **Git Commit SHA** (`RENDER_GIT_COMMIT`).

---

## 2. CI/CD Architecture & Pipeline Flow

The project follows a strict 4-stage automated pipeline orchestrated by **GitHub Actions** (`.github/workflows/ci-cd.yml`):

```
+--------------------+      +---------------------------+      +---------------------------+      +--------------------------+
|     Git Event      | ---> |  Stage 1: Lint & Tests   | ---> | Stage 2: Docker Container | ---> |   Stage 3: CD Deploy     |
| (Push / PR to main)|      | - ESLint & TypeScript     |      | - Multi-stage build       |      | - Render Cloud Webhook   |
|                    |      | - Native node:test suite  |      | - Smoke test: /health     |      | - Zero-downtime rollover |
+--------------------+      +---------------------------+      +---------------------------+      +--------------------------+
                                          |                                                                    |
                                   (On Failure: Exit)                                                 +--------------------+
                                   - Downstream jobs SKIPPED                                          | Production Live    |
                                   - Main branch protected                                            | Commit ID in UI    |
                                                                                                      +--------------------+
```

1. **Lint & Test Quality Gate:** Installs dependencies and runs the native Node.js test runner (`npm test`) and type checking (`npm run lint`).
2. **Container Gate:** Packages the application using Alpine Linux (`Dockerfile`) and executes a smoke test verifying `GET /health` inside the running container.
3. **Continuous Deployment (CD):** Once quality gates succeed on the `main` branch, a webhook triggers Render to deploy the verified Git commit.
4. **Production Verification:** Render polls `GET /health` to confirm HTTP 200 before routing live traffic.

---

## 3. Technology Stack

- **Backend Framework:** Node.js 22 LTS, Express.js
- **Frontend / Client:** React 19, Tailwind CSS, Lucide Icons, Vite
- **Document Processing:** Mammoth (DOCX raw XML parser), Native text stream processing
- **Testing:** Node.js native test runner (`node:test`, `node:assert/strict`)
- **Linting & Validation:** TypeScript / ESLint
- **Containerisation:** Docker (Alpine Linux, non-root execution via `USER node`)
- **CI/CD:** GitHub Actions runner (`ubuntu-latest`)
- **Cloud Hosting:** Render Web Service (Free Tier) with native Docker runtime

---

## 4. API Endpoints

| Method | Endpoint | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | None | Diagnostic probe returning service health, uptime, and running Git Commit ID |
| `GET` | `/api/newsletters` | None | Returns JSON array of all saved newsletters in server state |
| `GET` | `/api/newsletters/:id` | None | Returns JSON representation of a single newsletter |
| `POST` | `/api/convert` | Form-data or JSON | Ingests document / text and generates a structured newsletter draft |
| `PUT` | `/api/newsletters/:id` | JSON payload | Updates newsletter title, template, highlights, or sections |
| `DELETE`| `/api/newsletters/:id` | None | Deletes a newsletter from server storage |
| `GET` | `/api/newsletters/:id/export-html` | None | Downloads standalone HTML newsletter file |

### Sample `/health` Response
```json
{
  "status": "ok",
  "service": "docnews",
  "commit": "672b01c",
  "uptime": 1420.52,
  "timestamp": "2026-09-26T12:43:00.000Z"
}
```

---

## 5. How to Run Locally

### Prerequisites
- Node.js 22 LTS or higher
- Git

### Installation & Execution
```bash
# 1. Clone repository
git clone https://github.com/Mahek-Technophile/DocNews.git
cd DocNews

# 2. Install dependencies
npm install

# 3. Run automated tests (all 5 tests must pass)
npm test

# 4. Run lint check
npm run lint

# 5. Start development server (Node + Vite)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Docker Instructions

### Build Docker Image
```bash
docker build -t docnews .
```

### Run Docker Container
```bash
docker run -p 3000:3000 -e PORT=3000 docnews
```

### Verify Container Health
```bash
curl http://localhost:3000/health
```

---

## 7. CI Barrier & Failure Demo

To satisfy **Deliverable #5**, an intentional defect was committed on a test branch (`test/ci-failure-demo`):
- Assertion in `test/app.test.ts` was modified to expect `status === 'failed_to_trigger_ci_failure'`.
- Upon creating the Pull Request, GitHub Actions triggered the workflow.
- **Stage 1 (Lint & Test)** immediately failed with exit code 1.
- **Stage 2 (Docker Build)** and **Stage 3 (Deploy to Render)** were automatically marked as **SKIPPED**.
- **Result:** The faulty build was rejected before it could impact production, demonstrating that the deployment pipeline functions as a deterministic quality gate.

---

## 8. Author & Academic Information

- **Student Name:** Mahek Shukla
- **Panel:** B
- **Roll No:** 31
- **Course:** Cloud Computing and DevOps (CSE30040)
- **Assessment:** CCA 2 Continuous Assessment
- **Institution:** MIT World Peace University, Pune
- **Department:** Department of Computer Engineering and Technology
- **Course Faculty:** Prof. Pranati Waghodekar
- **Production URL:** [https://docnews.onrender.com](https://docnews.onrender.com)
- **Repository:** [https://github.com/Mahek-Technophile/DocNews](https://github.com/Mahek-Technophile/DocNews)
