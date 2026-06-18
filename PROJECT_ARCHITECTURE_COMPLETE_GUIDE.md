# Async Video Interview Platform: Complete Architecture and File Guide

## 1) Project Overview
This project is a microservice-based asynchronous video interview platform.

Main capabilities:
- HR/Admin creates sessions, questions, and candidate assignments.
- Candidate records interview responses and uploads video.
- Transcription service generates transcript from uploaded video.
- Reviewers watch video, add timestamped comments, and submit ratings.
- Analytics service aggregates candidate and reviewer metrics.

Architecture characteristics:
- API Gateway pattern for centralized entry and auth checks.
- Database-per-service isolation (Mongo instance per domain service).
- Event-driven communication with RabbitMQ fanout exchanges.
- Object storage via MinIO for interview video files.
- Polyglot services (Node.js + Python FastAPI/worker).

## 2) End-to-End Flow
### 2.1 Interview setup flow
1. Admin/HR logs in via gateway -> scheduling auth endpoints.
2. Admin creates session and question set in scheduling service.
3. Admin creates candidate assignments with invite tokens.
4. Candidate receives invite link based on token.

### 2.2 Candidate submission flow
1. Candidate opens interview link and fetches assignment/session/questions.
2. Candidate records interview in frontend (continuous recording with question boundaries).
3. Frontend uploads final video to upload service.
4. Upload service stores video to MinIO and writes upload job metadata.
5. Upload service publishes `video.uploaded` event.

### 2.3 Transcription flow
1. Transcription worker consumes `video.uploaded`.
2. Worker downloads video from MinIO.
3. Whisper transcribes audio to text + segments.
4. Transcription service stores transcript in its Mongo DB.
5. Transcription service publishes `transcript.ready` event.

### 2.4 Review and feedback flow
1. Reviewer logs in and opens review page.
2. Reviewer fetches latest video + transcript + existing comments.
3. Reviewer posts comments with video timestamps.
4. Feedback service stores comments, emits socket updates, and publishes `feedback.posted`.
5. Reviewer submits 5-metric rating; feedback service upserts rating.
6. Reviewer marks review complete; feedback service publishes `review.completed`.

### 2.5 Analytics flow
1. Analytics service consumes `transcript.ready` and computes candidate metrics.
2. Analytics service consumes `feedback.posted`/`review.completed` and updates reviewer metrics.
3. Dashboard pages fetch aggregated metrics and display summary views.

## 3) Service Responsibilities
- Gateway: central routing and JWT verification boundary.
- Scheduling service: users, sessions, assignments, question sets.
- Upload service: video ingestion, MinIO storage, upload metadata, publish video events.
- Transcription service: consume upload events, transcribe, publish transcript events.
- Feedback service: comments, ratings, review completion, real-time collaboration.
- Analytics service: event consumers and metrics aggregation APIs.
- Frontend: candidate, reviewer, and HR/admin user experiences.

## 4) Infrastructure and Ports
From docker-compose:
- MongoDB containers:
  - mongo-upload -> upload_db
  - mongo-transcription -> transcription_db
  - mongo-feedback -> feedback_db
  - mongo-scheduling -> scheduling_db
  - mongo-analytics -> analytics_db
- RabbitMQ:
  - 5672 AMQP
  - 15672 management UI
- MinIO:
  - 9000 S3 API
  - 9001 console
- Shared Docker network: `interview-net`

Typical service ports in project setup:
- gateway: 3000
- upload-service: 3001
- feedback-service: 3003
- scheduling-service: 3004
- transcription-service: 3005
- analytics-service: 3006
- frontend dev server: 3007 (or configured in frontend)

## 5) Events and Async Communication
### 5.1 Exchanges used
- `video.uploaded`
- `transcript.ready`
- `feedback.posted`
- `review.completed`

### 5.2 Publisher/consumer map
- Upload service publishes `video.uploaded`.
- Transcription worker consumes `video.uploaded`, then publishes `transcript.ready`.
- Analytics consumers consume `transcript.ready`, `feedback.posted`, `review.completed`.
- Feedback service publishes `feedback.posted` and `review.completed`.

## 6) API Surface (High-Level)
- Gateway public auth/invite routes and question route(s).
- Gateway protected proxy routes for scheduling/upload/feedback/analytics.
- Scheduling routes: session, assignment, question set, auth.
- Upload routes: upload job creation and latest video fetches.
- Feedback routes: comments, ratings, review completion.
- Analytics routes: candidate/reviewer/session metrics.
- Transcription routes: transcript retrieval by video/session.

## 7) Complete File-by-File Explanation
This section covers all current source/config/documentation files in this workspace (excluding `node_modules`, lockfiles, caches).

### 7.1 Root files
- `.env`: root-level environment values used by scripts/services.
- `.gitignore`: git ignore rules for env, dependencies, generated artifacts.
- `docker-compose.yml`: infrastructure definitions for Mongo, RabbitMQ, MinIO, network, volumes.
- `interview_platform_setup_guide.md`: setup instructions and environment preparation steps.
- `RUN.md`: runbook for starting/stopping/using project services.
- `start-all-services.ps1`: Windows script to boot project services.
- `stop-all-services.ps1`: Windows script to stop services and optional infra.

### 7.2 analytics-service
- `analytics-service/.env`: service-specific runtime configuration.
- `analytics-service/.env.example`: template env variables for analytics service.
- `analytics-service/index.js`: startup entry; connects DB/RabbitMQ; starts event consumers; starts HTTP server.
- `analytics-service/package.json`: dependencies and npm scripts.
- `analytics-service/src/app.js`: express app wiring and route mounting.
- `analytics-service/src/config/db.js`: Mongo connection helper.
- `analytics-service/src/config/rabbitmq.js`: RabbitMQ channel connection helper with retry.
- `analytics-service/src/consumers/events.consumer.js`: binds queues/exchanges and processes async events.
- `analytics-service/src/controllers/analytics.controller.js`: handlers that return analytics data to frontend.
- `analytics-service/src/models/candidateMetrics.model.js`: schema for candidate metric documents.
- `analytics-service/src/models/reviewerMetrics.model.js`: schema for reviewer metric documents.
- `analytics-service/src/routes/analytics.routes.js`: API routes mapped to analytics controller.

### 7.3 feedback-service
- `feedback-service/.env`: feedback service runtime config.
- `feedback-service/.env.example`: env template for feedback service.
- `feedback-service/index.js`: service entry; connects DB/RabbitMQ; initializes socket server.
- `feedback-service/package.json`: dependencies and scripts.
- `feedback-service/src/app.js`: express app + route mounting.
- `feedback-service/src/config/db.js`: Mongo connection for feedback domain.
- `feedback-service/src/config/rabbitmq.js`: RabbitMQ connection/channel helper.
- `feedback-service/src/controllers/feedback.controller.js`: comment/rating/review-complete business logic.
- `feedback-service/src/models/comment.model.js`: schema for timestamped reviewer comments.
- `feedback-service/src/models/reviewerRating.model.js`: schema for per-reviewer 5-metric ratings.
- `feedback-service/src/models/reviewSession.model.js`: schema for review duration/completion records.
- `feedback-service/src/routes/feedback.routes.js`: comment/rating/session-complete endpoint definitions.
- `feedback-service/src/services/rabbitmq.service.js`: event publish helper for feedback events.
- `feedback-service/src/services/socket.service.js`: socket.io setup and room-based real-time comment broadcast.

### 7.4 frontend
- `frontend/.env`: frontend env vars (API base URL and related config).
- `frontend/.env.example`: frontend env template.
- `frontend/package.json`: React app dependencies and scripts.
- `frontend/public/index.html`: HTML shell for React app.
- `frontend/src/App.js`: main router and route-to-page mapping.
- `frontend/src/components/CandidateCard.js`: UI card component for candidate details/listing.
- `frontend/src/components/CommentPanel.js`: reviewer comment entry and timeline UI.
- `frontend/src/components/InterviewToolsPanel.js`: embedded tool panel for interview/review assistance.
- `frontend/src/components/Navbar.js`: authenticated navigation UI.
- `frontend/src/components/PublicTopBar.js`: public-route top bar/navigation.
- `frontend/src/components/ReviewerRatingPanel.js`: 5-metric reviewer rating UI.
- `frontend/src/components/TranscriptViewer.js`: transcript renderer, including question-boundary split view.
- `frontend/src/components/VideoPlayer.js`: playback wrapper and controls for interview video.
- `frontend/src/components/VideoRecorder.js`: candidate-side recording component.
- `frontend/src/context/AuthContext.js`: global auth state/context provider.
- `frontend/src/hooks/useAuth.js`: helper hook for auth context usage.
- `frontend/src/hooks/useMediaRecorder.js`: recording lifecycle and blob handling.
- `frontend/src/hooks/useSocket.js`: socket client lifecycle/handlers.
- `frontend/src/index.css`: global styles.
- `frontend/src/index.js`: React bootstrap and root rendering.
- `frontend/src/pages/AdminLogin.js`: HR/admin login screen.
- `frontend/src/pages/AnalyticsDashboard.js`: analytics dashboard page.
- `frontend/src/pages/CandidateInterview.js`: candidate interview flow (questions, timer, recording, submit).
- `frontend/src/pages/HRDashboard.js`: HR view for session/candidate/review outcomes.
- `frontend/src/pages/Login.js`: general login entry.
- `frontend/src/pages/ReviewerDashboard.js`: reviewer landing/session selection.
- `frontend/src/pages/ReviewerLogin.js`: reviewer credential login page.
- `frontend/src/pages/VideoReview.js`: reviewer workbench for playback/transcript/comments/ratings.
- `frontend/src/services/api.js`: Axios instance/interceptors and API helpers.
- `frontend/src/services/upload.service.js`: upload request helpers.
- `frontend/src/utils/formatTimestamp.js`: utility to format timestamps for display.

### 7.5 gateway
- `gateway/.env`: gateway-specific runtime config.
- `gateway/.env.example`: gateway env template.
- `gateway/index.js`: gateway entrypoint server bootstrap.
- `gateway/package.json`: gateway dependencies/scripts.
- `gateway/src/app.js`: proxy and route composition (public vs protected forwarding).
- `gateway/src/middleware/auth.js`: JWT verification middleware for protected proxied paths.

### 7.6 scheduling-service
- `scheduling-service/.env`: scheduling runtime config.
- `scheduling-service/.env.example`: scheduling env template.
- `scheduling-service/index.js`: service startup and DB init.
- `scheduling-service/package.json`: dependencies/scripts.
- `scheduling-service/src/app.js`: express app and route mount points.
- `scheduling-service/src/config/db.js`: Mongo connection for scheduling domain.
- `scheduling-service/src/controllers/auth.controller.js`: login/register/invite-login/reviewer-login logic.
- `scheduling-service/src/controllers/scheduling.controller.js`: session/question/assignment handlers.
- `scheduling-service/src/models/assignment.model.js`: assignment + invite token schema.
- `scheduling-service/src/models/questionSet.model.js`: question set schema.
- `scheduling-service/src/models/session.model.js`: interview session schema.
- `scheduling-service/src/models/user.model.js`: users and roles schema.
- `scheduling-service/src/routes/auth.routes.js`: auth route definitions.
- `scheduling-service/src/routes/scheduling.routes.js`: scheduling route definitions.

### 7.7 transcription-service
- `transcription-service/.env`: transcription runtime config.
- `transcription-service/.env.example`: transcription env template.
- `transcription-service/app/__init__.py`: package initializer.
- `transcription-service/app/config/settings.py`: central settings and DB client setup.
- `transcription-service/app/models/transcript.py`: transcript model/shape helpers.
- `transcription-service/app/routes/transcription.py`: transcript query endpoints.
- `transcription-service/app/services/minio_service.py`: MinIO download and object access utilities.
- `transcription-service/app/services/rabbitmq_service.py`: publish helper for transcript-ready event.
- `transcription-service/app/services/whisper_service.py`: Whisper model loading and transcription invocation.
- `transcription-service/app/workers/consumer.py`: RabbitMQ consumer loop for `video.uploaded`, orchestration logic.
- `transcription-service/e2e_transcription_stderr.log`: stderr output from transcription E2E runs.
- `transcription-service/e2e_transcription_stdout.log`: stdout output from transcription E2E runs.
- `transcription-service/main.py`: FastAPI app startup and worker thread launch.
- `transcription-service/requirements.txt`: Python dependencies.

### 7.8 upload-service
- `upload-service/.env`: upload runtime config.
- `upload-service/.env.example`: upload env template.
- `upload-service/index.js`: service startup, DB and broker initialization.
- `upload-service/package.json`: dependencies/scripts.
- `upload-service/src/app.js`: express app + upload routes.
- `upload-service/src/config/db.js`: Mongo connection helper.
- `upload-service/src/config/minio.js`: MinIO client configuration.
- `upload-service/src/config/rabbitmq.js`: RabbitMQ connection helper.
- `upload-service/src/controllers/upload.controller.js`: upload endpoints, metadata persistence, latest-video queries.
- `upload-service/src/models/uploadJob.model.js`: upload job schema and status fields.
- `upload-service/src/routes/upload.routes.js`: upload endpoint definitions.
- `upload-service/src/services/minio.service.js`: object upload/signing helpers.
- `upload-service/src/services/rabbitmq.service.js`: publishes `video.uploaded`.

## 8) Notes on Current Workspace State
- `question-service` folder currently has only `node_modules` and no source files in this workspace snapshot.
- This guide intentionally documents active project source/config/docs files and operational scripts.

## 9) Suggested Viva (Microservices Subject) Talking Points
1. Why API Gateway is used instead of direct frontend-to-service calls.
2. Why each service owns its database (loose coupling and independent scaling).
3. Why RabbitMQ fanout events are used for async stages.
4. How eventual consistency appears between upload, transcription, feedback, and analytics.
5. How fault isolation works when one service is down.
6. How this architecture supports team parallel development.

## 10) Quick Demo Narrative
1. Start infra and all services.
2. Create session and assignment from HR/Admin flow.
3. Candidate records and uploads interview.
4. Show upload metadata and transcript generation delay (async behavior).
5. Reviewer posts comments and ratings.
6. Show analytics being updated from events.

---
If needed, this file can be split into:
- a short viva summary,
- a technical deep-dive,
- and a deployment/ops runbook.
