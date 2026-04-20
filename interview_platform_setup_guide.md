# Async Video Interview Platform

**MSA Course Project 2025-26**  
**Complete Pre-Development Walkthrough**

*Everything your group needs before writing a single line of code*

Covers: Software Installation • Mac + Windows • Git & GitHub • Docker • Project Structure • Service Connections • Environment Setup • Team Workflow

---

## Table of Contents

1. [Overview & Architecture Summary](#1-overview--architecture-summary)
2. [Software to Install — Windows](#2-software-to-install--windows)
3. [Software to Install — Mac](#3-software-to-install--mac)
4. [Verifying Everything Works](#4-verifying-everything-works)
5. [GitHub Setup & Team Workflow](#5-github-setup--team-workflow)
6. [Docker & Infrastructure Setup](#6-docker--infrastructure-setup)
7. [Project Folder Structure](#7-project-folder-structure)
8. [Environment Variables — Every Service](#8-environment-variables--every-service)
9. [How Services Connect to Each Other](#9-how-services-connect-to-each-other)
10. [RabbitMQ — Events & Queues](#10-rabbitmq--events--queues)
11. [MongoDB — Databases & Collections](#11-mongodb--databases--collections)
12. [MinIO — Video File Storage](#12-minio--video-file-storage)
13. [Frontend — Browser APIs](#13-frontend--browser-apis)
14. [Service Port Map](#14-service-port-map)
15. [Development Startup Order](#15-development-startup-order)
16. [Common Mistakes to Avoid](#16-common-mistakes-to-avoid)

---

## 1. Overview & Architecture Summary

This document walks your entire group through everything needed to set up, understand, and start building the Async Video Interview Platform before writing any code. Read this fully before touching a terminal.

The platform is made up of 7 independent microservices, each running as its own Node.js or Python process. They do not share databases. They talk to each other either through the API Gateway (synchronous REST calls) or through RabbitMQ (asynchronous events).

### The 7 Services

| Service | Language | What it does |
|---|---|---|
| API Gateway | Node.js | Single entry point. Verifies JWT tokens. Routes requests to the right service. |
| Question Service | Node.js | Returns the fixed 4 interview questions with a 60-second limit per question. |
| Upload Service | Node.js | Accepts video chunks from the browser. Saves to MinIO. Publishes `video.uploaded` event. |
| Transcription Service | Python | Consumes `video.uploaded`. Downloads video from MinIO. Runs Whisper. Saves transcript. Publishes `transcript.ready`. |
| Feedback Service | Node.js | Reviewers post timestamped comments via WebSocket. Supports live co-review with Socket.io. |
| Scheduling Service | Node.js | Manages interview sessions, question sets, candidate assignments, and invite tokens. |
| Analytics Service | Node.js | Tracks candidate performance (from transcripts) and reviewer behaviour (from feedback events). |

### Infrastructure (runs via Docker)

| Component | Purpose |
|---|---|
| MongoDB x5 | One separate MongoDB instance per service that needs a database (Upload, Transcription, Feedback, Scheduling, Analytics) |
| RabbitMQ | Message broker. Services publish events to it. Other services consume events from it asynchronously. |
| MinIO | S3-compatible object store. Stores the actual video files as binary blobs. The Upload Service writes to it; Transcription reads from it. |

---

## 2. Software to Install — Windows

Follow this in order. Do not skip steps. Each tool depends on the previous one being available.

### 2.1 Windows Terminal (recommended)

Install Windows Terminal from the Microsoft Store. It gives you a modern, tabbed terminal which is much better than the default Command Prompt. You will have multiple terminals open simultaneously during development.

### 2.2 Git

Git is required for version control and GitHub collaboration.

- Go to https://git-scm.com/download/win
- Download the installer and run it
- During installation, select **'Git from the command line and also from 3rd-party software'**
- Select **'Use Visual Studio Code as Git's default editor'** if you use VS Code
- Select **'Override the default branch name for new repositories'** and set it to `main`
- Leave all other defaults and finish

**Verify:** `git --version`

### 2.3 Node.js

Node.js powers 6 of the 7 services plus the frontend tooling. You need version 18 or higher.

- Go to https://nodejs.org
- Download the LTS version (the one labelled 'Recommended for most users')
- Run the installer with all defaults
- On the **'Tools for Native Modules'** page, check the box to automatically install Chocolatey and build tools — this is important for some npm packages

**Verify:** `node --version` (must show v18.x.x or higher), `npm --version`

### 2.4 Python

Python is required for the Transcription Service and for Whisper.

- Go to https://python.org/downloads
- Download Python 3.11 (recommended for Whisper compatibility)
- Run the installer — **CRITICAL: check 'Add Python to PATH' before clicking Install**
- Click 'Install Now'

**Verify:** `python --version`, `pip --version`

> ⚠️ If `python` is not found, try `python3` instead. On Windows, you may need to go to Settings > Apps > App Execution Aliases and turn off the Python App Installer aliases.

### 2.5 ffmpeg

Whisper uses ffmpeg to decode video/audio files before transcribing. It must be installed separately and added to your system PATH.

- Go to https://ffmpeg.org/download.html
- Under Windows, click **'Windows builds from gyan.dev'**
- Download the `ffmpeg-release-essentials.zip` file
- Extract it to `C:\ffmpeg`
- Open System Properties > Environment Variables
- Under System Variables, find **'Path'** and click Edit
- Click New and add `C:\ffmpeg\bin`
- Click OK on all dialogs and restart your terminal

**Verify:** `ffmpeg -version`

### 2.6 Docker Desktop

Docker runs MongoDB, RabbitMQ, and MinIO locally without installing them natively. It is essential.

- Go to https://docker.com/products/docker-desktop
- Download Docker Desktop for Windows
- Run the installer — it will require a restart
- After restart, Docker Desktop will launch automatically
- Wait for the Docker engine to fully start (the whale icon in the system tray turns steady)

> ⚠️ Docker Desktop requires WSL2 (Windows Subsystem for Linux). The installer will prompt you to install it if missing. Follow the prompts and restart again if asked.

**Verify:** `docker --version`, `docker compose version`

### 2.7 Visual Studio Code (recommended editor)

Go to https://code.visualstudio.com and install it. Once installed, add these extensions:

- **ESLint** — catches JavaScript errors as you type
- **Prettier** — auto-formats code on save
- **Python** — Microsoft's Python extension, required for the transcription service
- **MongoDB for VS Code** — lets you browse your databases visually
- **REST Client** — lets you test API endpoints from a `.http` file inside VS Code
- **GitLens** — shows who wrote each line and the full git history inline
- **Docker** — shows running containers, logs, and lets you manage them from VS Code

---

## 3. Software to Install — Mac

Mac users follow this section instead of Section 2. The tools are identical but the installation method is different.

### 3.1 Homebrew (Mac package manager)

Homebrew is the standard way to install developer tools on Mac. Install it first and everything else becomes one command.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

> ⚠️ After installing, Homebrew may ask you to run two `export` commands to add it to your PATH. Copy those commands and run them, then add them to your `~/.zprofile` file so they persist after restarts.

**Verify:** `brew --version`

### 3.2 Git

Git may already be installed on Mac via Xcode Command Line Tools. Check first, then install via Homebrew if needed.

```bash
git --version
# If not installed:
brew install git
```

### 3.3 Node.js

```bash
brew install node@18
brew link node@18
```

**Verify:** `node --version`, `npm --version`

### 3.4 Python

Mac often comes with Python 2 or 3.9. You need 3.11 for best Whisper compatibility.

```bash
brew install python@3.11
```

**Verify:** `python3.11 --version`, `pip3 --version`

> ⚠️ On Mac, always use `python3` and `pip3` instead of `python` and `pip` to avoid using the system Python 2.

### 3.5 ffmpeg

```bash
brew install ffmpeg
```

**Verify:** `ffmpeg -version`

### 3.6 Docker Desktop

- Go to https://docker.com/products/docker-desktop
- Download Docker Desktop for Mac — make sure to select the correct chip: **Apple Silicon (M1/M2/M3)** or **Intel**
- Open the downloaded `.dmg` file and drag Docker to Applications
- Open Docker from Applications and wait for it to fully start

**Verify:** `docker --version`, `docker compose version`

### 3.7 VS Code and Extensions

Go to https://code.visualstudio.com/Download and select the Mac version (Apple Silicon or Intel). Install the same extensions listed in Section 2.7.

One Mac-specific step: open VS Code, press `Cmd+Shift+P`, type **'Shell Command'** and select **'Install code command in PATH'**. This lets you open VS Code from the terminal:

```bash
code .
```

---

## 4. Verifying Everything Works

Before moving on, every team member should run these checks. If any command fails, revisit the relevant install section.

| Command | Expected output | If it fails |
|---|---|---|
| `git --version` | git version 2.x.x | Reinstall Git |
| `node --version` | v18.x.x or higher | Reinstall Node from nodejs.org |
| `npm --version` | 9.x.x or higher | Comes with Node, reinstall Node |
| `python --version` (Win) / `python3 --version` (Mac) | Python 3.11.x | Check PATH or reinstall |
| `pip --version` / `pip3 --version` | pip 23.x or higher | Python not on PATH |
| `ffmpeg -version` | ffmpeg version 6.x | Check PATH, see section 2.5 or 3.5 |
| `docker --version` | Docker version 24.x | Docker Desktop not running |
| `docker compose version` | Docker Compose version v2.x | Update Docker Desktop |

---

## 5. GitHub Setup & Team Workflow

### 5.1 Creating the Repository

- One team member creates a new repository on github.com
- Name it `interview-platform` or similar
- Set it to **Private**
- Initialize with a README
- Add a `.gitignore` — select **Node** from the template dropdown
- Go to Settings > Collaborators and invite all team members

### 5.2 Git Configuration — Every Team Member

Each person must configure their name and email. This is what appears in the commit history.

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git config --global init.defaultBranch main
```

### 5.3 SSH Key Setup (recommended over HTTPS)

SSH lets you push and pull without entering your password every time.

1. Generate a key:
   ```bash
   ssh-keygen -t ed25519 -C "your@email.com"
   ```
2. Press Enter to accept the default file location. Set a passphrase (optional but recommended).
3. Copy the public key:
   ```bash
   # Mac:
   cat ~/.ssh/id_ed25519.pub
   # Windows:
   type C:\Users\YourName\.ssh\id_ed25519.pub
   ```
4. Go to GitHub > Settings > SSH and GPG Keys > **New SSH Key**, paste the key and save.

**Verify:** `ssh -T git@github.com` (should say: *Hi username! You've successfully authenticated*)

### 5.4 Cloning the Repository

```bash
git clone git@github.com:your-org/interview-platform.git
cd interview-platform
```

### 5.5 Branching Strategy

Agree on this before anyone starts coding. The recommended approach for a student project:

| Branch | Purpose |
|---|---|
| `main` | Always working, deployable code. No one pushes directly to main. |
| `dev` | Integration branch. Merge your feature branches here first and test. |
| `feature/service-name` | One branch per service or feature. e.g. `feature/upload-service`, `feature/feedback-ws` |

**Typical workflow for each team member:**

```bash
git pull origin dev                        # Pull latest from dev
git checkout -b feature/my-service         # Create your branch
# Do your work, commit often
git push origin feature/my-service         # Push your branch
# Open a Pull Request on GitHub → dev
# Another team member reviews and merges
```

### 5.6 The .gitignore File

Make sure your root `.gitignore` includes:

```
node_modules/
.env
**/.env
__pycache__/
*.pyc
venv/
*.log
.DS_Store
dist/
build/
```

Each team member should also create a `.env.example` file in each service folder that shows what variables exist (with placeholder values, not real ones). This file gets committed so everyone knows what variables to set up.

---

## 6. Docker & Infrastructure Setup

Docker handles everything in the data layer. You do not install MongoDB, RabbitMQ, or MinIO natively. Docker runs them as containers. The `docker-compose.yml` file in the project root defines all of them.

### 6.1 What Docker Compose Does

When you run `docker compose up -d` from the project root, Docker will:

- Download the official MongoDB, RabbitMQ, and MinIO images (first time only, ~500MB total)
- Start 5 MongoDB containers, each on a different port
- Start RabbitMQ with its management web UI
- Start MinIO with its admin console
- Connect all containers to the same internal network so they can reach each other

### 6.2 MongoDB — 5 Separate Instances

| Service | Local Port | Connection string |
|---|---|---|
| Upload Service | 27017 | `mongodb://localhost:27017/upload_db` |
| Transcription Service | 27018 | `mongodb://localhost:27018/transcription_db` |
| Feedback Service | 27019 | `mongodb://localhost:27019/feedback_db` |
| Scheduling Service | 27020 | `mongodb://localhost:27020/scheduling_db` |
| Analytics Service | 27021 | `mongodb://localhost:27021/analytics_db` |

### 6.3 RabbitMQ

RabbitMQ runs on two ports. Port `5672` is used by your services to connect programmatically. Port `15672` is the management web UI.

**Management UI:** http://localhost:15672  
Username: `guest` / Password: `guest`

### 6.4 MinIO

Port `9000` is the S3 API. Port `9001` is the admin console.

**Admin console:** http://localhost:9001  
Username: `minioadmin` / Password: `minioadmin`

> ⚠️ Before the Upload Service can store files, you need to create a bucket in MinIO. Log into the console at `localhost:9001`, go to Buckets, and create a bucket called **`videos`**. Do this once before running the Upload Service.

### 6.5 Docker Commands You Will Use

| Command | What it does |
|---|---|
| `docker compose up -d` | Start all containers in the background |
| `docker compose down` | Stop and remove all containers |
| `docker compose ps` | See which containers are running |
| `docker compose logs rabbitmq` | See logs for a specific container |
| `docker compose restart mongo-upload` | Restart one container |

---

## 7. Project Folder Structure

This is the agreed folder layout for the entire monorepo. Each service is its own folder at the root level. They are completely independent — different `package.json` files, different dependencies, different `.env` files.

### 7.1 Root Level

The root contains only shared configuration. No service code lives here.

- `docker-compose.yml` — defines all infrastructure containers
- `.gitignore` — shared ignore rules for the whole project
- `README.md` — project description and how to run it
- `.env.example` — example of root-level variables if any

### 7.2 Inside Every Node.js Service

All six Node.js services follow the same internal folder pattern:

| Folder / File | Purpose |
|---|---|
| `index.js` | Entry point. Imports `app.js` and starts the HTTP server on the configured port. |
| `package.json` | Lists all npm dependencies for this service only. |
| `.env` | Environment variables for this service. Never committed to git. |
| `src/app.js` | Express app setup. Registers middleware and mounts routes. Does not start the server itself. |
| `src/routes/` | Defines URL paths. Each file groups related endpoints. No business logic here. |
| `src/controllers/` | Handles the request/response cycle. Calls services. Sends back JSON. |
| `src/models/` | Mongoose schemas. One file per MongoDB collection. |
| `src/services/` | Business logic and external connections (RabbitMQ, MinIO, axios calls to other services). |
| `src/config/` | Connection setup files that run once at startup (`db.js`, `rabbitmq.js`, `minio.js`). |
| `src/consumers/` | RabbitMQ event listeners. Each file subscribes to one event type and processes it. |

### 7.3 Transcription Service (Python)

| Folder / File | Purpose |
|---|---|
| `main.py` | Entry point. Starts FastAPI app and launches the background RabbitMQ worker thread. |
| `requirements.txt` | Lists all pip dependencies. Equivalent of `package.json`. |
| `.env` | Environment variables. Loaded via python-dotenv. |
| `venv/` | Python virtual environment. Created locally, never committed. |
| `app/routes/` | FastAPI route definitions. |
| `app/models/` | Pydantic models for request/response validation and pymongo schemas. |
| `app/services/` | Whisper transcription logic, MinIO client, RabbitMQ publisher. |
| `app/workers/` | Background thread that continuously listens for `video.uploaded` events. |
| `app/config/` | Database and settings configuration loaded from `.env`. |

### 7.4 Frontend

The frontend is a React app created with Create React App. Key folders inside `src/`:

| Folder | Purpose |
|---|---|
| `pages/` | One file per screen: Login, CandidateInterview, ReviewerDashboard, VideoReview, HRDashboard, AnalyticsDashboard. |
| `components/` | Reusable UI pieces: VideoRecorder, VideoPlayer, CommentPanel, TranscriptViewer, CandidateCard. |
| `hooks/` | Custom React hooks: `useSocket.js`, `useMediaRecorder.js`, `useAuth.js`. |
| `services/` | API call functions. `api.js` is the axios instance with JWT header. `upload.service.js` handles chunked upload. |
| `context/` | Global state via React Context. `AuthContext.js` holds the logged-in user and token. |
| `utils/` | Small helper functions. `formatTimestamp.js` converts milliseconds to `mm:ss` display format. |

---

## 8. Environment Variables — Every Service

Every service has its own `.env` file. These files are never committed to git. Each team member creates them locally by copying the `.env.example` file and filling in the values.

### 8.1 API Gateway

| Variable | Value / Explanation |
|---|---|
| `PORT` | `3000` |
| `JWT_SECRET` | A long random string. Must be the same value across all services that verify tokens. |
| `UPLOAD_SERVICE_URL` | `http://localhost:3001` |
| `TRANSCRIPTION_SERVICE_URL` | `http://localhost:3002` |
| `FEEDBACK_SERVICE_URL` | `http://localhost:3003` |
| `SCHEDULING_SERVICE_URL` | `http://localhost:3004` |
| `ANALYTICS_SERVICE_URL` | `http://localhost:3006` |
| `QUESTION_SERVICE_URL` | `http://localhost:3008` |

### 8.2 Upload Service

| Variable | Value / Explanation |
|---|---|
| `PORT` | `3001` |
| `MONGO_URI` | `mongodb://localhost:27017/upload_db` |
| `RABBITMQ_URL` | `amqp://localhost` |
| `MINIO_ENDPOINT` | `http://localhost:9000` |
| `MINIO_ACCESS_KEY` | `minioadmin` |
| `MINIO_SECRET_KEY` | `minioadmin` |
| `MINIO_BUCKET` | `videos` |

### 8.3 Transcription Service (Python)

| Variable | Value / Explanation |
|---|---|
| `MONGO_URI` | `mongodb://localhost:27018/transcription_db` |
| `RABBITMQ_URL` | `amqp://localhost` |
| `MINIO_ENDPOINT` | `http://localhost:9000` |
| `MINIO_ACCESS_KEY` | `minioadmin` |
| `MINIO_SECRET_KEY` | `minioadmin` |
| `WHISPER_MODEL` | `base` — options: `tiny`, `base`, `small`, `medium`, `large` |

### 8.4 Feedback Service

| Variable | Value / Explanation |
|---|---|
| `PORT` | `3003` |
| `MONGO_URI` | `mongodb://localhost:27019/feedback_db` |
| `RABBITMQ_URL` | `amqp://localhost` |
| `SCHEDULING_SERVICE_URL` | `http://localhost:3004` |

### 8.5 Scheduling Service

| Variable | Value / Explanation |
|---|---|
| `PORT` | `3004` |
| `MONGO_URI` | `mongodb://localhost:27020/scheduling_db` |

### 8.6 Analytics Service

| Variable | Value / Explanation |
|---|---|
| `PORT` | `3006` |
| `MONGO_URI` | `mongodb://localhost:27021/analytics_db` |
| `RABBITMQ_URL` | `amqp://localhost` |
| `TRANSCRIPTION_SERVICE_URL` | `http://localhost:3002` |

### 8.7 Question Service

| Variable | Value / Explanation |
|---|---|
| `PORT` | `3008` |

### 8.8 Frontend

| Variable | Value / Explanation |
|---|---|
| `REACT_APP_API_URL` | `http://localhost:3000` — all API calls go through the gateway |
| `REACT_APP_SOCKET_URL` | `http://localhost:3003` — direct Socket.io connection to Feedback Service |

---

## 9. How Services Connect to Each Other

### 9.1 Synchronous REST (request/response)

Synchronous calls happen when one service needs an answer immediately before it can continue.

| From | To | Why |
|---|---|---|
| API Gateway | All services | Routes every incoming client request to the correct downstream service after verifying the JWT token. |
| Feedback Service | Scheduling Service | Before saving a comment, Feedback must verify the session ID is valid via `GET /sessions/:sessionId`. |
| Analytics Service | Transcription Service | When Analytics receives a `transcript.ready` event, it calls `GET /transcripts/:videoId` for the full transcript text. |

### 9.2 Asynchronous Events (RabbitMQ)

Used when the publisher does not need to wait for a result. Messages wait in the queue if a consumer is temporarily down.

| Event | Publisher → Consumers | What triggers it |
|---|---|---|
| `video.uploaded` | Upload → Transcription | Fires after a video is fully saved to MinIO. Transcription starts the Whisper job. |
| `transcript.ready` | Transcription → Notification, Analytics | Fires when Whisper finishes. Notification emails the reviewer. Analytics runs NLP. |
| `feedback.posted` | Feedback → Notification, Analytics | Fires when a reviewer posts a comment. Notification emails the candidate. Analytics logs activity. |
| `review.completed` | Feedback → Analytics | Fires when a reviewer marks a session done. Analytics records review duration and comment spread. |

### 9.3 WebSocket (real-time co-review)

The Feedback Service uses Socket.io to maintain persistent WebSocket connections with reviewers.

- When a reviewer opens a video, their browser connects to the Feedback Service via WebSocket
- They join a 'room' identified by the session ID
- Any comment posted in the room is broadcast to all other connected reviewers in real time
- The frontend connects to the Feedback Service Socket.io port **directly** — not through the API Gateway

### 9.4 The API Gateway's Role

The Gateway is the only service the frontend calls for REST requests. It handles two things before forwarding any request:

1. **JWT Verification** — reads the `Authorization` header, verifies the token, rejects with `401` if invalid or missing
2. **Request Proxying** — forwards the request to the correct downstream service based on URL path

The Gateway contains no business logic and touches no database.

---

## 10. RabbitMQ — Events & Queues

### 10.1 Queue Names

Use these exact names across all services:

| Queue name | Used for |
|---|---|
| `video.uploaded` | Upload Service → Transcription Service |
| `transcript.ready` | Transcription Service → Analytics Service |
| `feedback.posted` | Feedback Service → Analytics Service |
| `review.completed` | Feedback Service → Analytics Service |

### 10.2 Message Payload

Every message should be a JSON object. Minimum fields per event:

- **`video.uploaded`**: `videoId`, `sessionId`, `candidateId`, `minioUrl`
- **`transcript.ready`**: `videoId`, `transcriptId`, `sessionId`, `candidateId`
- **`feedback.posted`**: `commentId`, `sessionId`, `reviewerId`, `videoTimestampMs`
- **`review.completed`**: `sessionId`, `reviewerId`, `startedAt`, `completedAt`, `commentCount`

### 10.3 Event Distribution Pattern

Use a **fanout exchange** when an event should be consumed by multiple services, and a direct queue when only one service needs the event. In this codebase, analytics consumes transcript and feedback events.

### 10.4 Checking Queues

The RabbitMQ management UI at `localhost:15672` (guest/guest) shows all queues, message counts, and connected consumers. Use this constantly during development to debug event flow.

---

## 11. MongoDB — Databases & Collections

### 11.1 Database-per-Service Rule

Each service has its own MongoDB instance on its own port. **No service is allowed to connect to another service's MongoDB.** If Service A needs data from Service B, it must ask Service B via REST or receive it via a RabbitMQ event.

### 11.2 Collections per Service

| Service | Collection | Key fields |
|---|---|---|
| Upload | `upload_jobs` | `id`, `session_id`, `candidate_id`, `minio_url`, `status` (UPLOADING/COMPLETE/FAILED), `created_at` |
| Transcription | `transcripts` | `id`, `video_id`, `full_text`, `language`, `duration_seconds`, `created_at` |
| Transcription | `transcript_segments` | `id`, `transcript_id`, `start_ms`, `end_ms`, `text`, `confidence` |
| Feedback | `comments` | `id`, `session_id`, `reviewer_id`, `video_timestamp_ms`, `text`, `created_at`, `updated_at` |
| Feedback | `review_sessions` | `id`, `session_id`, `reviewer_id`, `started_at`, `completed_at`, `duration_seconds` |
| Scheduling | `sessions` | `id`, `company_id`, `title`, `question_set_id`, `deadline`, `status` (OPEN/CLOSED/REVIEWING), `created_at` |
| Scheduling | `question_sets` | `id`, `company_id`, `questions` array (text + time_limit_seconds), `created_at` |
| Scheduling | `assignments` | `id`, `session_id`, `candidate_id`, `invite_token`, `submitted_at`, `status` (INVITED/SUBMITTED/REVIEWED) |
| Analytics | `candidate_metrics` | `id`, `candidate_id`, `session_id`, `filler_word_count`, `keyword_match_score`, `talk_time_seconds`, `sentiment_score`, `overall_rank`, `computed_at` |
| Analytics | `reviewer_metrics` | `id`, `reviewer_id`, `session_id`, `video_id`, `review_duration_seconds`, `comment_count`, `timestamp_spread_score`, `turnaround_hours`, `computed_at` |

### 11.3 Connecting with VS Code

Install the **MongoDB for VS Code** extension. Connect to each instance using the connection strings from Section 8.

---

## 12. MinIO — Video File Storage

MinIO is an S3-compatible object store. It stores binary video files recorded by candidates. It is **not** a database and should not store structured data.

### 12.1 How it fits in the flow

1. The Upload Service receives video chunks from the browser via HTTP multipart upload
2. It assembles the chunks and writes the file to the `videos` bucket using the MinIO S3 client
3. It stores the resulting MinIO URL in its own MongoDB (`upload_jobs` collection)
4. It publishes a `video.uploaded` event to RabbitMQ, including the MinIO URL
5. The Transcription Service downloads the video from MinIO, passes it to Whisper, then deletes its local copy

### 12.2 The S3 SDK

Both services use S3-compatible SDKs pointed at `localhost:9000` instead of AWS:

- Node.js: `@aws-sdk/client-s3`
- Python: `boto3`

### 12.3 First-Time Setup

1. Start Docker: `docker compose up -d`
2. Open the MinIO console at http://localhost:9001
3. Log in with `minioadmin` / `minioadmin`
4. Go to **Buckets** in the left sidebar
5. Click **Create Bucket**
6. Name it exactly **`videos`** (lowercase, no spaces)
7. Leave all settings as default and create it

This only needs to be done once per machine. The bucket persists as long as the Docker volume exists.

---

## 13. Frontend — Browser APIs

### 13.1 MediaRecorder API

The browser's built-in video recording API. Allows the candidate page to access the user's webcam and microphone.

- The browser asks for camera and microphone permission before recording starts
- Recording produces a stream of data chunks at a configurable interval (e.g. every 1 second)
- These chunks are sent to the Upload Service as they are produced (chunked upload approach)
- Video is typically encoded as **WebM** in Chrome and **MP4** in Safari

> ⚠️ Safari may produce different video formats than Chrome. Whisper handles both, but test recording on both browsers during development.

### 13.2 WebSocket via Socket.io

The frontend uses the `socket.io-client` package to connect to the Feedback Service.

- Connection is established when a reviewer opens a video for review
- The reviewer joins a named room corresponding to the session ID
- When they post a comment, the frontend emits an event to the server
- The server broadcasts the comment to all other clients in the same room in real time

### 13.3 JWT Authentication Flow

1. When a user logs in, the Gateway issues a JWT token and returns it to the frontend
2. The frontend stores this token (in `localStorage` or React Context)
3. Every subsequent API request includes the token: `Authorization: Bearer <token>`
4. The Gateway verifies this token before forwarding any request
5. The token contains the user's ID, role (`candidate` / `reviewer` / `HR`), and expiry time

### 13.4 Chunked Video Upload

- The MediaRecorder produces data chunks every second while recording
- Each chunk is sent to `POST /upload/video` immediately as it arrives
- The Upload Service reassembles the chunks into a complete file
- After the final chunk, status updates to `COMPLETE` and the `video.uploaded` event fires

---

## 14. Service Port Map

| Service / Component | Port | Access |
|---|---|---|
| API Gateway | 3000 | All frontend REST calls go here |
| Upload Service | 3001 | Internal — reached via Gateway |
| Transcription Service | 3002 | Internal — reached via Gateway or Analytics direct call |
| Feedback Service | 3003 | REST via Gateway + direct WebSocket from frontend |
| Scheduling Service | 3004 | Internal — reached via Gateway or Feedback direct call |
| Analytics Service | 3006 | Internal — reached via Gateway |
| Frontend (React) | 3007 | Browser — `npm start` |
| Question Service | 3008 | Internal — reached via Gateway |
| MongoDB — Upload | 27017 | Docker container |
| MongoDB — Transcription | 27018 | Docker container |
| MongoDB — Feedback | 27019 | Docker container |
| MongoDB — Scheduling | 27020 | Docker container |
| MongoDB — Analytics | 27021 | Docker container |
| RabbitMQ (AMQP) | 5672 | Services connect here programmatically |
| RabbitMQ (Management UI) | 15672 | Browser — http://localhost:15672 |
| MinIO (S3 API) | 9000 | Services connect here programmatically |
| MinIO (Console) | 9001 | Browser — http://localhost:9001 |

---

## 15. Development Startup Order

Services have dependencies. Start them in this order to avoid crashes.

| Step | Command | Wait for... |
|---|---|---|
| 1 | `docker compose up -d` | All containers running — check with `docker compose ps` |
| 2 | Create MinIO bucket | Go to `localhost:9001` and create the `videos` bucket if not already done |
| 3 | `cd scheduling-service && node index.js` | 'Connected to MongoDB' and 'Server running on port 3004' |
| 4 | `cd question-service && node index.js` | 'Question Service running on port 3008' |
| 5 | `cd gateway && node index.js` | 'Gateway running on port 3000' |
| 6 | `cd upload-service && node index.js` | 'Connected to MongoDB' and RabbitMQ connected message |
| 7 | `cd transcription-service && uvicorn main:app --port 3002` | 'Whisper model loaded' — can take 30-60s on first run |
| 8 | `cd feedback-service && node index.js` | 'Socket.io ready' and MongoDB connected |
| 9 | `cd analytics-service && node index.js` | All RabbitMQ consumers started |
| 10 | `cd frontend && npm start` | Browser opens at `localhost:3000` (or 3007) |

> ⚠️ Open a separate terminal tab for each service. Do not run all services in the same terminal.

---

## 16. Common Mistakes to Avoid

### 16.1 Git & Collaboration

- **Never commit a `.env` file.** If you accidentally do, remove it immediately and rotate any secrets.
- **Never push directly to `main`.** Always use a feature branch and a Pull Request.
- **Always pull from `dev`** before creating a new branch to avoid merge conflicts.
- Write meaningful commit messages: `'Fix RabbitMQ connection retry on Upload Service startup'` not `'fix stuff'`.

### 16.2 Docker & Infrastructure

- Always start Docker Desktop before running `docker compose`. Services will fail if Docker is not running.
- If a MongoDB port is already in use:
  - Windows: `netstat -ano | findstr :27017`
  - Mac: `lsof -i :27017`
- Do not run `docker compose down` between coding sessions unless you want to lose all database data. Use `docker compose stop` instead to preserve data.

### 16.3 Node.js Services

- Each service must have its own `node_modules` folder. Do not try to share one at the root.
- Run `npm install` inside each service folder individually before starting it.
- If you change a `.env` file, you must restart the service — environment variables are loaded once at startup.

### 16.4 Python / Transcription Service

- Always activate the virtual environment before running `pip install` or starting the service.
- Mac users: use `python3` and `pip3`, not `python` and `pip`.
- The Whisper model downloads automatically on first load (~140MB for `base`). Ensure you have internet and disk space.
- If ffmpeg is not found, Whisper will crash. Double-check it is installed and on your PATH.

### 16.5 Architecture Rules

- **Never query another service's MongoDB directly.** Always go through REST or RabbitMQ.
- **Never put business logic in routes files.** Routes define paths, controllers handle logic.
- The API Gateway does not contain business logic. It only verifies JWT and proxies requests.
- RabbitMQ connections can fail on startup if RabbitMQ is not yet ready. Add retry logic in your `rabbitmq.js` config file.

### 16.6 Mac-Specific

- Docker Desktop on Apple Silicon (M1/M2/M3) runs containers using emulation for x86 images. If you see architecture errors, look for `linux/arm64` variants.
- Use `python3` and `pip3` everywhere.
- If you get a 'permission denied' error when running scripts: `chmod +x script.sh`
- The `.DS_Store` files macOS creates must be in your `.gitignore` to avoid cluttering the repo for your Windows teammates.

---

*— End of Document —*
