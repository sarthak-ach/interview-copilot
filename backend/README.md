# Interview Copilot - Spring Boot Backend Template

This is a portfolio-grade backend template for **Interview Copilot** built using **Spring Boot 3**, **Java 21**, and **Spring Data JPA**, pre-configured to connect to **PostgreSQL** and **Redis**.

---

## 1. Prerequisites

Make sure you have the following installed on your machine:

- **Java 21 JDK** (e.g., Eclipse Temurin, Amazon Corretto)
- **Maven** (or use the included Maven wrapper `mvnw`)
- **Docker & Docker Compose** (for running PostgreSQL and Redis locally)

---

## 2. Infrastructure Setup (Local)

Launch containerized instances of PostgreSQL and Redis using the included `docker-compose.yml` file:

```bash
# Navigate to the backend directory
cd backend

# Start the containers in the background
docker compose up -d
```

This starts:
- **PostgreSQL** on port `5432` (database: `interview_copilot`, user: `postgres`, password: `postgres`)
- **Redis** on port `6379` (no password)

---

## 3. Configuration

Database coordinates are configured in `src/main/resources/application.yml`. You can override defaults using environment variables:

| Variable | Description | Default Value |
| --- | --- | --- |
| `DATABASE_URL` | JDBC Connection URL | `jdbc:postgresql://localhost:5432/interview_copilot` |
| `DATABASE_USER` | DB Username | `postgres` |
| `DATABASE_PASSWORD`| DB Password | `postgres` |

---

## 4. Run the Application

Execute the boot application using Maven:

```bash
# Using Maven wrapper
./mvnw spring-boot:run
```

The application will start on port `8080` (CORS is permitted for all origins by default in mock mode).

---

## 5. Directory Structure

```text
src/main/java/com/interviewcopilot/
  ├── InterviewCopilotApplication.java   # App entry point
  ├── auth/
  │    └── AuthController.java           # Login / Register endpoints
  ├── users/
  │    ├── User.java                     # User schema entity
  │    └── UserRepository.java           # DB CRUD repo
  ├── resumes/
  │    ├── Resume.java                   # Resume entity
  │    ├── ResumeReview.java             # Score & AI feedback JSON
  │    ├── ResumeRepository.java         
  │    ├── ResumeReviewRepository.java   
  │    └── ResumeController.java         # File upload & scoring API
  ├── jobs/
  │    ├── JobDescription.java           # JD mapping
  │    ├── JobMatch.java                 # Alignment score map
  │    ├── JobDescriptionRepository.java 
  │    ├── JobMatchRepository.java       
  │    └── JobController.java            # Matching algorithm REST API
  ├── interviews/
  │    ├── InterviewSession.java         # AI sessions tracker
  │    ├── InterviewMessage.java         # Session chat history log
  │    ├── InterviewSessionRepository.java
  │    ├── InterviewMessageRepository.java
  │    └── InterviewController.java      # Chatbot REST APIs
  ├── applications/
  │    ├── Application.java              # Pipeline tracker card
  │    ├── ApplicationRepository.java    
  │    └── ApplicationController.java    # Kanban status updates CRUD API
  └── config/
       └── SecurityConfig.java           # Spring Security setup
```

---

## 6. Verifying API Endpoints

Once the application is running, you can hit the following endpoints using Curl, Postman, or Thunder Client:

### Auth Endpoints
- **Register**: `POST http://localhost:8080/api/auth/register`
- **Login**: `POST http://localhost:8080/api/auth/login`

### Resume Endpoints
- **Upload File**: `POST http://localhost:8080/api/resumes/upload` (Form-data: `file` & `userId`)
- **Get AI Suggestions**: `GET http://localhost:8080/api/resumes/{id}/review`

### Matching Endpoints
- **Run JD Compare**: `POST http://localhost:8080/api/jobs/matches` (Body: `{ "resumeId": "...", "jobDescriptionId": "..." }`)

### Mock Interview Endpoints
- **Start session**: `POST http://localhost:8080/api/interviews/start` (Body: `{ "userId": "...", "category": "Spring Boot", "interviewerStyle": "Standard" }`)
- **Submit answer**: `POST http://localhost:8080/api/interviews/{sessionId}/messages` (Body: `{ "content": "My answer..." }`)

### Job Tracker Endpoints
- **Create Card**: `POST http://localhost:8080/api/applications`
- **Update Stage**: `PUT http://localhost:8080/api/applications/{id}` (Body: `{ "status": "Technical Round", "notes": "Updated details" }`)
