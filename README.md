# DOCNEWS — Document to Newsletter Converter

![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)
![Platform](https://img.shields.io/badge/Node.js-22%20LTS-green)
![Container](https://img.shields.io/badge/Docker-Alpine-cyan)
![Deployment](https://img.shields.io/badge/Deployment-Render-purple)
![Assessment](https://img.shields.io/badge/CCA%202-MIT--WPU-orange)

An automated document ingestion and newsletter generation platform built for the **Cloud Computing and DevOps (CSE30040)** CCA 2 individual assessment at **MIT World Peace University, Pune**.

---

## 1. Project Overview

**DOCNEWS** transforms dense university notices, syllabus briefs, activity circulars, and departmental reports into structured, visually engaging newsletters.

### Key Capabilities
- **Multi-Format Ingestion:** Extracts text from Microsoft Word (`.docx` via `mammoth`), Markdown (`.md`), and raw text paste.
- **Deterministic Synthesis Engine:** Automatically extracts titles, headings, lead stories, and key bullet points using explainable, rule-based algorithms (no expensive or flaky AI APIs).
- **Multiple Newsletter Themes:** Supports **Campus**, **Corporate**, **Modern**, and **Minimal** designs.
- **Section & Highlight Editor:** Allows real-time editing of headlines, stories, and summary bullets before publishing.
- **Dynamic Server-Side State:** Newsletters are saved, updated, and queried through dynamic Express endpoints.
- **Export Formats:** One-click pure HTML downloads and printer-ready CSS (`@media print`) layouts.
- **DevOps Telemetry:** Includes a `/health` endpoint returning live service status and running **Git Commit SHA** (`RENDER_GIT_COMMIT`).

---

## 2. CI/CD Architecture & Pipeline Flow

The project follows a strict 4-stage pipeline orchestrated by **GitHub Actions** (`.github/workflows/ci-cd.yml`):

```
+---------------+      +---------------------+      +-----------------------------+      +---------------------------+      +------------------+
|   git push    | ---> | Stage 1: CI (Test)   | ---> | Stage 2: Docker Smoke Test  | ---> | Stage 3: CD (Render Deploy)| ---> | Stage 4: Live URL|
| (Push to main)|      | Lint & `node:test`  |      | Container Build & /health   |      | Trigger Render Webhook    |      | Commit displayed |
+---------------+      +---------------------+      +-----------------------------+      +---------------------------+      +------------------+
```

1. **Lint & Test Quality Gate:** Installs dependencies and runs the native Node.js test runner (`npm test`) and type checking (`npm run lint`).
2. **Container Gate:** Packages the application using Alpine Linux (`Dockerfile`) and executes a smoke test verifying `GET /health` inside the container.
3. **Continuous Deployment (CD):** Once both quality gates succeed on the `main` branch, a webhook triggers Render to deploy the verified Git commit.

---

## 3. Technology Stack

- **Backend Framework:** Node.js 22 LTS, Express.js
- **Frontend / Client:** React, Tailwind CSS, Lucide Icons, Vite
- **Document Processing:** Mammoth (DOCX raw XML parser), Native text stream processing
- **Testing:** Node.js native test runner (`node:test`, `node:assert/strict`)
- **Linting & Validation:** TypeScript / ESLint
- **Containerisation:** Docker (Alpine Linux, non-root execution via `USER node`)
- **CI/CD:** GitHub Actions runner (`ubuntu-latest`)
- **Cloud Hosting:** Render Web Service (Free Tier)

---

## 4. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Diagnostic probe returning service health and running Git Commit ID |
| `GET` | `/api/newsletters` | Returns JSON array of all saved newsletters |
| `GET` | `/api/newsletters/:id` | Returns JSON representation of a single newsletter |
| `POST` | `/api/convert` | Ingests document / text and generates a structured newsletter draft |
| `PUT` | `/api/newsletters/:id` | Updates newsletter title, template, highlights, or sections |
| `DELETE`| `/api/newsletters/:id` | Deletes a newsletter from server storage |
| `GET` | `/api/newsletters/:id/export-html` | Downloads standalone HTML newsletter file |

---

## 5. How to Run Locally

### Prerequisites
- Node.js 22 LTS or higher
- Git

### Installation
```bash
# 1. Clone repository
git clone https://github.com/<your-username>/docnews.git
cd docnews

# 2. Install dependencies
npm install

# 3. Run automated tests
npm test

# 4. Run lint check
npm run lint

# 5. Start development server
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

## 7. Author & Academic Information
- **Course:** Cloud Computing and DevOps (CSE30040)
- **Institution:** MIT World Peace University, Pune
- **Department:** Department of Computer Engineering and Technology
- **Course Faculty:** Pranati Waghodekar
