# Async Video Interview Platform

An enterprise-ready, microservices-based asynchronous video interview platform. This platform enables recruiters to create structured video interviews, candidates to record and submit responses, and reviewers to grade submissions collaboratively in real-time, supported by automated Whisper-based audio transcribing and metric analytics.

---

## System Architecture

The project is designed using a decoupled, database-per-service microservices pattern. Direct client-to-service communication is gated by an **API Gateway** which handles request routing and JWT validation. Asynchronous tasks (like audio transcription and analytics metric generation) are handled in an event-driven manner using **RabbitMQ**.



## Technology Stack

*   **Frontend**: React (SPA), Axios, TailwindCSS, Socket.io Client
*   **Gateway & Node.js Services**: Express.js, Mongoose, RabbitMQ (`amqplib`), Socket.io
*   **Transcription Service**: Python FastAPI, OpenAI Whisper (local execution), PyMongo, MinIO Python Client, `pika` (RabbitMQ worker)
*   **Databases**: MongoDB (isolated instances per service)
*   **Object Storage**: MinIO (S3-compatible API)
*   **Message Broker**: RabbitMQ (utilizing Fanout Exchanges)
*   **Utilities**: FFmpeg (video/audio extraction)

---

## Project Structure

```
├── gateway/                 # Express API gateway (reverse proxy & JWT authentication)
├── scheduling-service/     # Session, question set, user accounts, and token invites
├── upload-service/         # Handles video upload chunking, metadata, and MinIO storage
├── transcription-service/  # Python worker/API transcribing video responses using Whisper
├── feedback-service/       # Dynamic collaborative comments (Socket.io) & reviewer metrics
├── analytics-service/      # Aggregates candidate transcripts and reviewer statistics
├── frontend/               # Unified dashboard app for Candidates, Reviewers, and HR Admins
├── tools/                  # Script utilities (e.g. finding unused JS files)
├── docker-compose.yml      # Infrastructure definitions (MongoDBs, RabbitMQ, MinIO)
├── start-all-services.ps1  # Windows service startup automation script
└── stop-all-services.ps1   # Windows service shutdown automation script
```

---

## Port and Database Map

| Service Name | Port | Database / Backend Storage | MongoDB Port (Docker Container) |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `3000` | *None (Reverse Proxy)* | - |
| **Upload Service** | `3001` | `upload_db` / MinIO (S3) | `27017` (`mongo-upload`) |
| **Transcription Worker/API** | `3002` (or `3005`) | `transcription_db` | `27018` (`mongo-transcription`) |
| **Feedback Service** | `3003` | `feedback_db` | `27019` (`mongo-feedback`) |
| **Scheduling Service** | `3004` | `scheduling_db` | `27020` (`mongo-scheduling`) |
| **Analytics Service** | `3006` | `analytics_db` | `27021` (`mongo-analytics`) |
| **Frontend Dev Server** | `3007` | *Browser (React)* | - |
| **RabbitMQ Management UI** | `15672` | *AMQP Protocol (Port 5672)* | - |
| **MinIO Web Console** | `9001` | *S3 Storage API (Port 9000)* | - |

---

## Event-Driven Workflow (RabbitMQ)

Services operate with loose coupling using standard event streams:

1.  **Candidate Submits Response** -> `Upload Service` stores video in MinIO -> publishes `video.uploaded` event.
2.  **Transcription Engine Runs** -> `Transcription Worker` consumes `video.uploaded` -> downloads video -> processes with Whisper AI -> saves to Mongo -> publishes `transcript.ready` event.
3.  **Analytics / Reviews Begin** 
    *   `Analytics Service` consumes `transcript.ready` -> computes candidates' language/sentiment metrics.
    *   `Feedback Service` publishes `feedback.posted` and `review.completed` when reviewers complete evaluation.
    *   `Analytics Service` consumes feedback/review completed events -> updates reviewer dashboards.

---

## Getting Started

### 1. Prerequisites
Ensure the following tools are installed locally:
*   Node.js v18+ (includes `npm`)
*   Python v3.11+
*   Docker Desktop (with Docker Compose)
*   FFmpeg (must be accessible in your system's environment `PATH`)

Verify installation:
```bash
node -v
npm -v
python --version
docker compose version
ffmpeg -version
```

### 2. Install Project Dependencies

Install npm dependencies across all Node packages simultaneously using PowerShell (Root):
```powershell
$packageFiles = Get-ChildItem -Path . -Filter package.json -Recurse -File | Where-Object { $_.FullName -notmatch '\\node_modules\\' }
foreach ($pkg in $packageFiles) {
  Push-Location $pkg.DirectoryName
  npm install
  Pop-Location
}
```
*For macOS / Linux environments, run `npm install` inside the folders: `gateway`, `scheduling-service`, `upload-service`, `feedback-service`, `analytics-service`, and `frontend`.*

Configure the Python Virtual Environment for transcription:
```bash
cd transcription-service
python -m venv .venv

# Windows activation
.\.venv\Scripts\Activate.ps1
# macOS/Linux activation
source .venv/bin/activate

python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
cd ..
```

### 3. Initialize Environment Files
Copy sample `.env.example` configurations to local `.env` files for each component:
```powershell
$services = @("gateway", "upload-service", "transcription-service", "feedback-service", "scheduling-service", "analytics-service", "frontend")
foreach ($s in $services) {
  if (-not (Test-Path "$s/.env") -and (Test-Path "$s/.env.example")) {
    Copy-Item "$s/.env.example" "$s/.env"
  }
}
```
*Note: Make sure the `JWT_SECRET` variables inside `gateway/.env` and `scheduling-service/.env` are identical.*

### 4. Start Infrastructure Containers
Boot up MongoDB instances, MinIO, and RabbitMQ:
```bash
docker compose up -d
```

### 5. Setup MinIO Bucket
1. Open the MinIO console in your browser: [http://localhost:9001](http://localhost:9001).
2. Sign in with standard developer credentials: `minioadmin` / `minioadmin`.
3. Create a bucket explicitly named `videos`.

---

## Run the Application

### Option A: Automate using Windows PowerShell
From the root directory, trigger the automation wrapper:
```powershell
# Boots up Docker instances and launches all frontend/backend services in separate terminal tabs
.\start-all-services.ps1 -IncludeFrontend
```
To shut everything down:
```powershell
.\stop-all-services.ps1 -IncludeDocker
```

### Option B: Run Manually (Cross-platform)
Start each service in a separate terminal shell:
```bash
# Gateway
cd gateway && npm start

# Scheduling
cd scheduling-service && npm start

# Video Upload
cd upload-service && npm start

# Collaborative Feedback
cd feedback-service && npm start

# Data Analytics
cd analytics-service && npm start

# Transcription Engine (Python)
cd transcription-service
# (Activate virtual environment first)
python -m uvicorn main:app --host 0.0.0.0 --port 3002 --reload

# Client Frontend
cd frontend && npm start
```

---

## Application Portals & Credentials

Once services are running, access the user portals:

*   **Candidate Login Portal**: [http://localhost:3007/login](http://localhost:3007/login)
*   **Recruiter/HR Admin Login**: [http://localhost:3007/admin/login](http://localhost:3007/admin/login)
*   **Recruiter Dashboard**: [http://localhost:3007/hr](http://localhost:3007/hr)
*   **Reviewer Workbench**: [http://localhost:3007/reviewer](http://localhost:3007/reviewer)
*   **Diagnostics Tools**: [http://localhost:3007/tools/tokens](http://localhost:3007/tools/tokens) *(Generate quick tokens & check audio transcription logs)*

---

## Troubleshooting

### 1. HTTP Gateway 504 / Connection Timeout
*   Verify that your Gateway (`3000`) and Scheduling (`3004`) services have booted completely and are listening.
*   Run `Get-NetTCPConnection -LocalPort 3000,3004 -State Listen` (Windows) to verify if the ports are active.

### 2. Transcription "ffmpeg not found" / "WinError 2"
*   Ensure the `ffmpeg` package is globally configured in your system `PATH`.
*   Alternatively, add `FFMPEG_PATH` pointing directly to your executable in `transcription-service/.env` (e.g. `FFMPEG_PATH=C:\path\to\ffmpeg\bin\ffmpeg.exe` or `FFMPEG_PATH=/opt/homebrew/bin/ffmpeg`).
*   Restart the Python uvicorn instance after editing the `.env` configuration.
