# Async Video Interview Platform - Run Guide

This file is a quick setup + run guide for teammates.
Use this after pulling the repository.

---

## 1) Prerequisites

Install these first:

- Node.js 18+ (npm included)
- Python 3.11 recommended
- Docker Desktop (with Docker Compose)
- FFmpeg (must be available in PATH)

Windows checks:

```powershell
node -v
npm -v
python --version
docker --version
docker compose version
ffmpeg -version
```

If ffmpeg is installed but not recognized, add its bin folder to User PATH and reopen terminal.

### macOS quick install/check

Yes - FFmpeg works on macOS.

Install core tools with Homebrew:

```bash
brew install node@18 python@3.11 ffmpeg
```

Checks:

```bash
node -v
npm -v
python3 --version
docker --version
docker compose version
ffmpeg -version
```

If `ffmpeg` is still not found, restart terminal or add Homebrew bin to PATH in `~/.zprofile`.

---

## 2) Install All Dependencies

From repo root:

```powershell
# Node dependencies for all Node services + frontend
$packageFiles = Get-ChildItem -Path . -Filter package.json -Recurse -File | Where-Object { $_.FullName -notmatch '\\node_modules\\' }
foreach ($pkg in $packageFiles) {
  Push-Location $pkg.DirectoryName
  npm install
  Pop-Location
}
```

Transcription service Python dependencies:

```powershell
cd transcription-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

macOS equivalent:

```bash
cd transcription-service
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

---

## 3) Environment Files

Each service uses its own .env file.

Create them from examples if missing:

```powershell
$services = @(
  "gateway",
  "question-service",
  "upload-service",
  "transcription-service",
  "feedback-service",
  "scheduling-service",
  "notification-service",
  "analytics-service",
  "frontend"
)
foreach ($s in $services) {
  if (-not (Test-Path "$s/.env") -and (Test-Path "$s/.env.example")) {
    Copy-Item "$s/.env.example" "$s/.env"
  }
}
```

Important:

- Use the same JWT_SECRET in gateway and scheduling-service
- Configure SMTP_USER and SMTP_PASS in notification-service if email sending is needed
- FFmpeg path can be forced in transcription-service/.env with FFMPEG_PATH if required

Example (optional) for transcription-service/.env:

```env
FFMPEG_PATH=C:\path\to\ffmpeg\bin\ffmpeg.exe
```

macOS example:

```env
FFMPEG_PATH=/opt/homebrew/bin/ffmpeg
```

---

## 4) Start Infrastructure (Docker)

From repo root:

```powershell
docker compose up -d
docker compose ps
```

This starts:

- MongoDB containers
- RabbitMQ
- MinIO

---

## 5) MinIO One-Time Bucket Setup

1. Open http://localhost:9001
2. Login with minioadmin / minioadmin
3. Create bucket named videos

This bucket is used by upload and transcription flows.

---

## 6) Start Everything Together

Use the helper script from repo root:

```powershell
.\start-all-services.ps1 -IncludeFrontend
```

Notes:

- This opens separate terminals for services.
- Use -SkipDocker if Docker is already running.

Examples:

```powershell
.\start-all-services.ps1
.\start-all-services.ps1 -IncludeFrontend
.\start-all-services.ps1 -SkipDocker -IncludeFrontend
```

macOS note: `start-all-services.ps1` is Windows-only.
On macOS, start each service manually in separate terminal tabs:

```bash
cd scheduling-service && npm start
cd question-service && npm start
cd gateway && npm start
cd upload-service && npm start
cd transcription-service && source .venv/bin/activate && python -m uvicorn main:app --host 0.0.0.0 --port 3002 --reload
cd feedback-service && npm start
cd notification-service && npm start
cd analytics-service && npm start
cd frontend && npm start
```

---

## 7) Stop Everything Together

From repo root:

```powershell
.\stop-all-services.ps1
```

To also stop Docker infra:

```powershell
.\stop-all-services.ps1 -IncludeDocker
```

macOS note: `stop-all-services.ps1` is Windows-only. Stop services with `Ctrl+C` in each tab, then:

```bash
docker compose stop
```

---

## 8) Health Checks

After startup, verify:

```powershell
Invoke-WebRequest http://localhost:3001/health | Select-Object StatusCode
Invoke-WebRequest http://localhost:3002/health | Select-Object StatusCode
Invoke-WebRequest http://localhost:3004/health | Select-Object StatusCode
Invoke-WebRequest http://localhost:3008/health | Select-Object StatusCode
```

Useful URLs:

- Frontend: http://localhost:3007
- Gateway: http://localhost:3000
- RabbitMQ UI: http://localhost:15672
- MinIO Console: http://localhost:9001

Role routes:

- Candidate login: http://localhost:3007/login
- Admin login (HR + reviewer): http://localhost:3007/admin/login
- Reviewer dashboard: http://localhost:3007/reviewer
- HR dashboard: http://localhost:3007/hr
- Fixed questions API (via gateway): http://localhost:3000/questions/fixed

---

## 9) Token + Transcript Tools

Open:

- http://localhost:3007/tools/tokens

You can:

- Generate universal invite token
- Check transcript status by video/job ID

Candidate login now supports invite token based access.

Candidate interview format is fixed:

- Exactly 4 questions from Question Service
- 60 seconds per question
- One continuous recording for the full interview
- Candidate can click Done / Next early per question
- Final upload is a single video file at the end

---

## 10) Reviewer Rating + HR Ranking

Reviewer flow:

1. Login from `/admin/login` with reviewer account
2. Open reviewer dashboard and select a session
3. In video review, add comments at timestamps and submit 5 metric ratings:
  - Communication
  - Technical depth
  - Problem solving
  - Confidence
  - Culture fit

HR flow:

1. Login from `/admin/login` with HR account
2. Open `/hr`
3. Use tabs:
  - Overview: KPIs + metric bars + score distribution
  - Candidate Rankings: top candidates + ranked table
  - Session Insights: per-session average score and status

---

## 11) Common Issues and Fixes

### A) Failed to load sessions (HTTP 504)

Usually gateway/scheduling not running or timed out.

Check ports:

```powershell
Get-NetTCPConnection -LocalPort 3000,3004 -State Listen
```

### B) ffmpeg not found / WinError 2 in transcription failures

- Ensure ffmpeg -version works in the same terminal running transcription
- Optionally set FFMPEG_PATH in transcription-service/.env
- Restart transcription service after path/env changes

### C) Transcript exists but not visible in page

Check:

- transcription_db.transcripts contains video_id
- Frontend is freshly restarted after latest code changes
- Correct candidate/video selected in reviewer or analytics flow

### D) Mongo collection name confusion

Upload records may appear in collection named uploadjobs (mongoose default pluralization), not upload_jobs.

---

## 12) Port Map

- 3000: Gateway
- 3001: Upload Service
- 3002: Transcription Service
- 3003: Feedback Service
- 3004: Scheduling Service
- 3005: Notification Service
- 3006: Analytics Service
- 3007: Frontend
- 3008: Question Service
- 5672: RabbitMQ AMQP
- 15672: RabbitMQ Management UI
- 9000: MinIO API
- 9001: MinIO Console

---

## 13) Team Tip

When pulling latest changes:

1. Pull
2. Re-run dependency installs if package files changed
3. Restart all services with start-all-services.ps1
